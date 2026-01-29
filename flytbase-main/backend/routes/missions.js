import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Mission from '../models/Mission.js';
import Waypoint from '../models/Waypoint.js';
import MissionLog from '../models/MissionLog.js';
import Drone from '../models/Drone.js';
import User from '../models/User.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { WaypointGenerator } from '../services/waypointGenerator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all missions
router.get('/', async (req, res) => {
  try {
    const { status, drone_id } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (drone_id) {
      query.drone_id = new mongoose.Types.ObjectId(drone_id);
    }

    const missions = await Mission.find(query)
      .populate('drone_id', 'name serial_number')
      .populate('created_by', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Transform to match expected format
    const formattedMissions = missions.map(mission => ({
      ...mission,
      id: mission._id.toString(),
      drone_name: mission.drone_id?.name,
      drone_serial: mission.drone_id?.serial_number,
      created_by_name: mission.created_by?.name,
      drone_id: mission.drone_id?._id?.toString(),
      created_by: mission.created_by?._id?.toString(),
    }));

    res.json(formattedMissions);
  } catch (error) {
    console.error('Get missions error:', error);
    res.status(500).json({ error: 'Failed to fetch missions' });
  }
});

// Get single mission with waypoints
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid mission ID' });
    }

    const mission = await Mission.findById(id)
      .populate('drone_id', 'name serial_number')
      .populate('created_by', 'name')
      .lean();

    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    // Get waypoints
    const waypoints = await Waypoint.find({ mission_id: id })
      .sort({ sequence_number: 1 })
      .lean();

    const formattedMission = {
      ...mission,
      id: mission._id.toString(),
      drone_name: mission.drone_id?.name,
      drone_serial: mission.drone_id?.serial_number,
      created_by_name: mission.created_by?.name,
      drone_id: mission.drone_id?._id?.toString(),
      created_by: mission.created_by?._id?.toString(),
      waypoints: waypoints.map(wp => ({
        ...wp,
        id: wp._id.toString(),
        mission_id: wp.mission_id.toString(),
      })),
    };

    res.json(formattedMission);
  } catch (error) {
    console.error('Get mission error:', error);
    res.status(500).json({ error: 'Failed to fetch mission' });
  }
});

// Create mission
router.post('/',
  [
    body('name').trim().notEmpty(),
    body('altitude').isFloat({ min: 0 }),
    body('mission_type').isIn(['grid', 'perimeter', 'crosshatch', 'custom']),
    body('survey_area_polygon').isObject()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        description,
        drone_id,
        mission_type,
        altitude,
        overlap_percentage = 70,
        sensor_type,
        sensor_frequency,
        survey_area_polygon,
        scheduled_start_time
      } = req.body;

      // Create mission
      const mission = await Mission.create({
        name,
        description,
        drone_id: drone_id ? new mongoose.Types.ObjectId(drone_id) : null,
        created_by: new mongoose.Types.ObjectId(req.user.id),
        mission_type,
        altitude,
        overlap_percentage,
        sensor_type: sensor_type || null,
        sensor_frequency: sensor_frequency || null,
        survey_area_polygon,
        scheduled_start_time: scheduled_start_time || null,
      });

      // Generate waypoints based on mission type
      let waypoints = [];
      const bounds = survey_area_polygon.bounds || {
        minLat: Math.min(...survey_area_polygon.coordinates.map(c => c.lat)),
        maxLat: Math.max(...survey_area_polygon.coordinates.map(c => c.lat)),
        minLng: Math.min(...survey_area_polygon.coordinates.map(c => c.lng)),
        maxLng: Math.max(...survey_area_polygon.coordinates.map(c => c.lng))
      };

      switch (mission_type) {
        case 'grid':
          waypoints = WaypointGenerator.generateGrid(bounds, altitude, overlap_percentage);
          break;
        case 'perimeter':
          waypoints = WaypointGenerator.generatePerimeter(
            survey_area_polygon.coordinates,
            altitude
          );
          break;
        case 'crosshatch':
          waypoints = WaypointGenerator.generateCrosshatch(bounds, altitude, overlap_percentage);
          break;
        case 'custom':
          waypoints = survey_area_polygon.waypoints || [];
          break;
      }

      // Insert waypoints
      if (waypoints.length > 0) {
        const waypointDocs = waypoints.map(wp => ({
          mission_id: mission._id,
          sequence_number: wp.sequence_number,
          latitude: wp.latitude,
          longitude: wp.longitude,
          altitude: wp.altitude,
          status: wp.status || 'pending',
        }));

        await Waypoint.insertMany(waypointDocs);
      }

      // Update mission with waypoint count
      mission.total_waypoints = waypoints.length;
      await mission.save();

      // Fetch complete mission with populated fields
      const populatedMission = await Mission.findById(mission._id)
        .populate('drone_id', 'name serial_number')
        .populate('created_by', 'name')
        .lean();

      const waypointsData = await Waypoint.find({ mission_id: mission._id })
        .sort({ sequence_number: 1 })
        .lean();

      const formattedMission = {
        ...populatedMission,
        id: populatedMission._id.toString(),
        drone_name: populatedMission.drone_id?.name,
        drone_serial: populatedMission.drone_id?.serial_number,
        created_by_name: populatedMission.created_by?.name,
        drone_id: populatedMission.drone_id?._id?.toString(),
        created_by: populatedMission.created_by?._id?.toString(),
        waypoints: waypointsData.map(wp => ({
          ...wp,
          id: wp._id.toString(),
          mission_id: wp.mission_id.toString(),
        })),
      };

      res.status(201).json(formattedMission);
    } catch (error) {
      console.error('Create mission error:', error);
      res.status(500).json({ error: 'Failed to create mission' });
    }
  }
);

// Update mission
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid mission ID' });
    }

    const allowedFields = [
      'name', 'description', 'drone_id', 'status', 'altitude',
      'overlap_percentage', 'sensor_type', 'sensor_frequency',
      'scheduled_start_time', 'survey_area_polygon'
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'drone_id' && updates[field]) {
          updateData[field] = new mongoose.Types.ObjectId(updates[field]);
        } else {
          updateData[field] = updates[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const mission = await Mission.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('drone_id', 'name serial_number')
      .populate('created_by', 'name')
      .lean();

    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    const formattedMission = {
      ...mission,
      id: mission._id.toString(),
      drone_name: mission.drone_id?.name,
      drone_serial: mission.drone_id?.serial_number,
      created_by_name: mission.created_by?.name,
      drone_id: mission.drone_id?._id?.toString(),
      created_by: mission.created_by?._id?.toString(),
    };

    res.json(formattedMission);
  } catch (error) {
    console.error('Update mission error:', error);
    res.status(500).json({ error: 'Failed to update mission' });
  }
});

// Control mission (pause/resume/abort)
router.post('/:id/control',
  [
    body('action').isIn(['start', 'pause', 'resume', 'abort'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { action } = req.body;
      const simulationEngine = req.app.locals.simulationEngine;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid mission ID' });
      }

      // Get current mission status
      const mission = await Mission.findById(id);

      if (!mission) {
        return res.status(404).json({ error: 'Mission not found' });
      }

      const currentStatus = mission.status;
      let newStatus;

      switch (action) {
        case 'start':
          if (currentStatus !== 'scheduled' && currentStatus !== 'paused') {
            return res.status(400).json({ error: 'Mission must be scheduled or paused to start' });
          }
          await simulationEngine.startMission(id);
          newStatus = 'in-progress';
          break;
        case 'pause':
          if (currentStatus !== 'in-progress') {
            return res.status(400).json({ error: 'Mission must be in-progress to pause' });
          }
          await simulationEngine.pauseMission(id);
          newStatus = 'paused';
          break;
        case 'resume':
          if (currentStatus !== 'paused') {
            return res.status(400).json({ error: 'Mission must be paused to resume' });
          }
          await simulationEngine.startMission(id);
          newStatus = 'in-progress';
          break;
        case 'abort':
          if (!['in-progress', 'paused'].includes(currentStatus)) {
            return res.status(400).json({ error: 'Mission must be active to abort' });
          }
          await simulationEngine.abortMission(id);
          newStatus = 'aborted';
          break;
      }

      // Log the action
      await MissionLog.create({
        mission_id: new mongoose.Types.ObjectId(id),
        log_type: 'control_action',
        message: `Mission ${action}ed`,
        metadata: { action, previous_status: currentStatus }
      });

      res.json({ success: true, status: newStatus, action });
    } catch (error) {
      console.error('Control mission error:', error);
      res.status(500).json({ error: error.message || 'Failed to control mission' });
    }
  }
);

// Delete mission
router.delete('/:id', authorizeRole('admin', 'operator'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid mission ID' });
    }

    const mission = await Mission.findByIdAndDelete(id);

    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    // Waypoints and logs will be deleted via cascade (handled by Mongoose middleware if needed)
    // For now, delete them explicitly
    await Waypoint.deleteMany({ mission_id: id });
    await MissionLog.deleteMany({ mission_id: id });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete mission error:', error);
    res.status(500).json({ error: 'Failed to delete mission' });
  }
});

export default router;
