import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Drone from '../models/Drone.js';
import Mission from '../models/Mission.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all drones
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const drones = await Drone.find(query).sort({ name: 1 }).lean();

    // Get active missions for each drone
    const droneIds = drones.map(d => d._id);
    const activeMissions = await Mission.find({
      drone_id: { $in: droneIds },
      status: { $in: ['scheduled', 'in-progress', 'paused'] }
    })
      .select('drone_id name status progress_percentage')
      .lean();

    const missionMap = {};
    activeMissions.forEach(mission => {
      const droneId = mission.drone_id.toString();
      if (!missionMap[droneId]) {
        missionMap[droneId] = mission;
      }
    });

    const formattedDrones = drones.map(drone => {
      const activeMission = missionMap[drone._id.toString()];
      return {
        ...drone,
        id: drone._id.toString(),
        active_mission: activeMission ? {
          id: activeMission._id.toString(),
          name: activeMission.name,
          status: activeMission.status,
          progress_percentage: activeMission.progress_percentage,
        } : null,
      };
    });

    res.json(formattedDrones);
  } catch (error) {
    console.error('Get drones error:', error);
    res.status(500).json({ error: 'Failed to fetch drones' });
  }
});

// Get single drone
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid drone ID' });
    }

    const drone = await Drone.findById(id).lean();

    if (!drone) {
      return res.status(404).json({ error: 'Drone not found' });
    }

    // Get active mission if any
    const activeMission = await Mission.findOne({
      drone_id: new mongoose.Types.ObjectId(id),
      status: { $in: ['scheduled', 'in-progress', 'paused'] }
    })
      .select('name status progress_percentage')
      .sort({ createdAt: -1 })
      .lean();

    const formattedDrone = {
      ...drone,
      id: drone._id.toString(),
      active_mission: activeMission ? {
        id: activeMission._id.toString(),
        name: activeMission.name,
        status: activeMission.status,
        progress_percentage: activeMission.progress_percentage,
      } : null,
    };

    res.json(formattedDrone);
  } catch (error) {
    console.error('Get drone error:', error);
    res.status(500).json({ error: 'Failed to fetch drone' });
  }
});

// Create drone
router.post('/',
  authorizeRole('admin', 'operator'),
  [
    body('name').trim().notEmpty(),
    body('serial_number').trim().notEmpty(),
    body('model').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        serial_number,
        model,
        location,
        battery_level = 100
      } = req.body;

      const drone = await Drone.create({
        name,
        serial_number,
        model: model || null,
        location: location || null,
        battery_level,
        status: 'idle',
      });

      const formattedDrone = {
        ...drone.toObject(),
        id: drone._id.toString(),
      };

      res.status(201).json(formattedDrone);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Serial number already exists' });
      }
      console.error('Create drone error:', error);
      res.status(500).json({ error: 'Failed to create drone' });
    }
  }
);

// Update drone
router.put('/:id', authorizeRole('admin', 'operator'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid drone ID' });
    }

    const allowedFields = [
      'name', 'model', 'status', 'battery_level',
      'current_latitude', 'current_longitude', 'current_altitude',
      'location', 'health_status'
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const drone = await Drone.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!drone) {
      return res.status(404).json({ error: 'Drone not found' });
    }

    const formattedDrone = {
      ...drone,
      id: drone._id.toString(),
    };

    res.json(formattedDrone);
  } catch (error) {
    console.error('Update drone error:', error);
    res.status(500).json({ error: 'Failed to update drone' });
  }
});

// Delete drone
router.delete('/:id', authorizeRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid drone ID' });
    }

    // Check if drone has active missions
    const activeMissions = await Mission.countDocuments({
      drone_id: new mongoose.Types.ObjectId(id),
      status: { $in: ['scheduled', 'in-progress', 'paused'] }
    });

    if (activeMissions > 0) {
      return res.status(400).json({
        error: 'Cannot delete drone with active missions'
      });
    }

    const drone = await Drone.findByIdAndDelete(id);

    if (!drone) {
      return res.status(404).json({ error: 'Drone not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete drone error:', error);
    res.status(500).json({ error: 'Failed to delete drone' });
  }
});

// Recharge drone battery
router.post('/:id/recharge', authorizeRole('admin', 'operator'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[FLEET] Recharge requested for drone: ${id} by user: ${req.user.email}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn(`[FLEET] Invalid drone ID: ${id}`);
      return res.status(400).json({ error: 'Invalid drone ID' });
    }

    const drone = await Drone.findById(id);
    if (!drone) {
      console.warn(`[FLEET] Drone not found: ${id}`);
      return res.status(404).json({ error: 'Drone not found' });
    }

    console.log(`[FLEET] Current drone status: ${drone.status}, battery: ${drone.battery_level}`);

    if (drone.status === 'in-mission') {
      console.warn(`[FLEET] Recharge rejected: drone ${id} is in mission`);
      return res.status(400).json({ error: 'Cannot recharge while in mission' });
    }

    drone.battery_level = 100;
    await drone.save();
    console.log(`[FLEET] Recharge success for drone: ${id}`);

    res.json({ success: true, battery_level: 100 });
  } catch (error) {
    console.error('[FLEET] Recharge error:', error);
    res.status(500).json({ error: 'Failed to recharge drone' });
  }
});

// Perform maintenance
router.post('/:id/maintenance', authorizeRole('admin', 'operator'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[FLEET] Maintenance requested for drone: ${id} by user: ${req.user.email}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn(`[FLEET] Invalid drone ID: ${id}`);
      return res.status(400).json({ error: 'Invalid drone ID' });
    }

    const drone = await Drone.findById(id);
    if (!drone) {
      console.warn(`[FLEET] Drone not found: ${id}`);
      return res.status(404).json({ error: 'Drone not found' });
    }

    console.log(`[FLEET] Current drone status: ${drone.status}, health: ${drone.health_status}`);

    if (drone.status === 'in-mission') {
      console.warn(`[FLEET] Maintenance rejected: drone ${id} is in mission`);
      return res.status(400).json({ error: 'Cannot perform maintenance while in mission' });
    }

    drone.status = 'idle';
    drone.health_status = 'healthy';
    await drone.save();
    console.log(`[FLEET] Maintenance success for drone: ${id}`);

    res.json({ success: true, status: 'idle', health_status: 'healthy' });
  } catch (error) {
    console.error('[FLEET] Maintenance error:', error);
    res.status(500).json({ error: 'Failed to perform maintenance' });
  }
});

// Expand fleet (Seed)
router.post('/seed', authorizeRole('admin'), async (req, res) => {
  try {
    const mockDrones = [
      { name: 'Interceptor-9', serial_number: `INT-${Math.floor(Math.random() * 9000) + 1000}`, model: 'Phantom X', status: 'idle', battery_level: 85, health_status: 'healthy', location: 'Bravo-Grid-7' },
      { name: 'Surveillance-4', serial_number: `SUR-${Math.floor(Math.random() * 9000) + 1000}`, model: 'Mavic Air Pro', status: 'offline', battery_level: 42, health_status: 'warning', location: 'Sector-4-Dock' },
      { name: 'Heavy-Lift-1', serial_number: `HL-${Math.floor(Math.random() * 9000) + 1000}`, model: 'Matrice 300', status: 'maintenance', battery_level: 12, health_status: 'critical', location: 'Base-Repair-A' },
      { name: 'Ghost-Scan-7', serial_number: `GS-${Math.floor(Math.random() * 9000) + 1000}`, model: 'Autel Evo II', status: 'idle', battery_level: 100, health_status: 'healthy', location: 'North-Watchtower' }
    ];

    const created = await Drone.insertMany(mockDrones);
    res.json({ success: true, count: created.length });
  } catch (error) {
    console.error('[FLEET] Seed error:', error);
    res.status(500).json({ error: 'Failed to expand fleet' });
  }
});

export default router;
