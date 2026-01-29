import express from 'express';
import mongoose from 'mongoose';
import Mission from '../models/Mission.js';
import Drone from '../models/Drone.js';
import Waypoint from '../models/Waypoint.js';
import MissionLog from '../models/MissionLog.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Get mission statistics
router.get('/missions/stats', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const dateFilter = {};
    if (start_date && end_date) {
      dateFilter.createdAt = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    // Unified aggregation for all mission statistics
    const statsResult = await Mission.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          aborted: { $sum: { $cond: [{ $eq: ['$status', 'aborted'] }, 1, 0] } },
          active: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          avg_duration: { $avg: { $cond: [{ $gt: ['$flight_duration_seconds', 0] }, '$flight_duration_seconds', null] } },
          total_distance: { $sum: '$distance_covered_km' },
          avg_coverage: { $avg: { $cond: [{ $gt: ['$area_coverage_percentage', 0] }, '$area_coverage_percentage', null] } }
        }
      }
    ]);

    const stats = {
      total_missions: statsResult[0]?.total || 0,
      completed_missions: statsResult[0]?.completed || 0,
      aborted_missions: statsResult[0]?.aborted || 0,
      active_missions: statsResult[0]?.active || 0,
      avg_duration_seconds: statsResult[0]?.avg_duration || 0,
      total_distance_km: statsResult[0]?.total_distance || 0,
      avg_coverage_percentage: statsResult[0]?.avg_coverage || 0,
    };

    // Mission type breakdown
    const typeBreakdown = await Mission.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$mission_type',
          count: { $sum: 1 },
          avg_duration: { $avg: '$flight_duration_seconds' }
        }
      },
      {
        $project: {
          mission_type: '$_id',
          count: 1,
          avg_duration: 1,
          _id: 0
        }
      }
    ]);

    // Recent missions
    const recentMissions = await Mission.find(dateFilter)
      .select('id name status mission_type flight_duration_seconds distance_covered_km completed_at')
      .sort({ completedAt: -1 })
      .limit(10)
      .lean();

    const formattedRecent = recentMissions.map(m => ({
      id: m._id.toString(),
      name: m.name,
      status: m.status,
      mission_type: m.mission_type,
      flight_duration_seconds: m.flight_duration_seconds,
      distance_covered_km: m.distance_covered_km,
      completed_at: m.completed_at,
    }));

    res.json({
      overall: stats,
      by_type: typeBreakdown,
      recent: formattedRecent
    });
  } catch (error) {
    console.error('Get mission stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get fleet statistics
router.get('/fleet/stats', async (req, res) => {
  try {
    // Unified aggregation for fleet overview
    const fleetResult = await Drone.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          idle: { $sum: { $cond: [{ $eq: ['$status', 'idle'] }, 1, 0] } },
          active: { $sum: { $cond: [{ $eq: ['$status', 'in-mission'] }, 1, 0] } },
          offline: { $sum: { $cond: [{ $eq: ['$status', 'offline'] }, 1, 0] } },
          avg_battery: { $avg: '$battery_level' },
          healthy: { $sum: { $cond: [{ $eq: ['$health_status', 'healthy'] }, 1, 0] } },
          warning: { $sum: { $cond: [{ $eq: ['$health_status', 'warning'] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $eq: ['$health_status', 'critical'] }, 1, 0] } },
        }
      }
    ]);

    const overview = {
      total_drones: fleetResult[0]?.total || 0,
      idle_drones: fleetResult[0]?.idle || 0,
      active_drones: fleetResult[0]?.active || 0,
      offline_drones: fleetResult[0]?.offline || 0,
      avg_battery_level: fleetResult[0]?.avg_battery || 0,
      healthy_drones: fleetResult[0]?.healthy || 0,
      warning_drones: fleetResult[0]?.warning || 0,
      critical_drones: fleetResult[0]?.critical || 0,
    };

    // Battery distribution
    const batteryDist = await Drone.aggregate([
      {
        $project: {
          battery_range: {
            $switch: {
              branches: [
                { case: { $gte: ['$battery_level', 80] }, then: 'High (80-100%)' },
                { case: { $gte: ['$battery_level', 50] }, then: 'Medium (50-79%)' },
                { case: { $gte: ['$battery_level', 20] }, then: 'Low (20-49%)' },
                { case: { $lt: ['$battery_level', 20] }, then: 'Critical (<20%)' }
              ],
              default: 'Unknown'
            }
          }
        }
      },
      {
        $group: {
          _id: '$battery_range',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          battery_range: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      overview,
      battery_distribution: batteryDist
    });
  } catch (error) {
    console.error('Get fleet stats error:', error);
    res.status(500).json({ error: 'Failed to fetch fleet statistics' });
  }
});

// Get mission performance report
router.get('/missions/:id/performance', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid mission ID' });
    }

    const mission = await Mission.findById(id)
      .populate('drone_id', 'name serial_number')
      .lean();

    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    // Get waypoint completion stats
    const waypointStats = await Waypoint.aggregate([
      { $match: { mission_id: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          total_waypoints: { $sum: 1 },
          completed_waypoints: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          in_progress_waypoints: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get mission logs
    const logs = await MissionLog.find({ mission_id: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formattedLogs = logs.map(log => ({
      ...log,
      id: log._id.toString(),
      mission_id: log.mission_id.toString(),
    }));

    const formattedMission = {
      ...mission,
      id: mission._id.toString(),
      drone_name: mission.drone_id?.name,
      drone_serial: mission.drone_id?.serial_number,
      drone_id: mission.drone_id?._id?.toString(),
    };

    res.json({
      mission: formattedMission,
      waypoints: waypointStats[0] || {
        total_waypoints: 0,
        completed_waypoints: 0,
        in_progress_waypoints: 0
      },
      logs: formattedLogs
    });
  } catch (error) {
    console.error('Get mission performance error:', error);
    res.status(500).json({ error: 'Failed to fetch performance report' });
  }
});

export default router;
