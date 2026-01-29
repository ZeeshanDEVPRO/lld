/**
 * Simulation Engine
 * Timer-based mission execution simulator
 * Updates mission progress, waypoints, and drone status
 */

import mongoose from 'mongoose';
import Mission from '../models/Mission.js';
import Waypoint from '../models/Waypoint.js';
import Drone from '../models/Drone.js';
import MissionLog from '../models/MissionLog.js';
import { WaypointGenerator } from './waypointGenerator.js';

export class SimulationEngine {
  constructor(io) {
    this.io = io;
    this.activeSimulations = new Map(); // missionId -> intervalId
  }

  /**
   * Start simulating a mission
   */
  async startMission(missionId) {
    if (this.activeSimulations.has(missionId)) {
      return; // Already running
    }

    try {
      // Get mission details
      const mission = await Mission.findById(missionId)
        .populate('drone_id', 'battery_level')
        .lean();

      if (!mission) {
        throw new Error('Mission not found');
      }

      if (mission.status !== 'scheduled' && mission.status !== 'paused') {
        throw new Error('Mission must be scheduled or paused to start');
      }

      // Get waypoints
      const waypoints = await Waypoint.find({ mission_id: missionId })
        .sort({ sequence_number: 1 })
        .lean();

      if (waypoints.length === 0) {
        throw new Error('No waypoints found for mission');
      }

      // Update mission status
      await Mission.findByIdAndUpdate(missionId, {
        status: 'in-progress',
        started_at: new Date()
      });

      // Update drone status
      if (mission.drone_id) {
        await Drone.findByIdAndUpdate(mission.drone_id._id, {
          status: 'in-mission'
        });
      }

      // Find starting waypoint (first incomplete)
      let currentWaypointIndex = waypoints.findIndex(wp => wp.status === 'pending');
      if (currentWaypointIndex === -1) {
        currentWaypointIndex = waypoints.findIndex(wp => wp.status === 'in-progress');
      }
      if (currentWaypointIndex === -1) {
        currentWaypointIndex = 0;
      }

      let startTime = Date.now();
      if (mission.started_at) {
        startTime = new Date(mission.started_at).getTime();
      }

      // Start simulation interval (update every 2 seconds)
      const intervalId = setInterval(async () => {
        try {
          await this.updateMissionProgress(missionId, waypoints, currentWaypointIndex, mission);
          currentWaypointIndex++;

          // Check if mission is complete
          if (currentWaypointIndex >= waypoints.length) {
            await this.completeMission(missionId, mission.drone_id?._id?.toString());
            clearInterval(intervalId);
            this.activeSimulations.delete(missionId);
          }
        } catch (error) {
          console.error(`Simulation error for mission ${missionId}:`, error);
          clearInterval(intervalId);
          this.activeSimulations.delete(missionId);
        }
      }, 2000); // Update every 2 seconds

      this.activeSimulations.set(missionId, intervalId);

      // Emit initial update
      this.io.emit('mission:update', {
        missionId,
        status: 'in-progress',
        message: 'Mission started'
      });
    } catch (error) {
      console.error(`Failed to start mission ${missionId}:`, error);
      throw error;
    }
  }

  /**
   * Update mission progress
   */
  async updateMissionProgress(missionId, waypoints, currentIndex, mission) {
    if (currentIndex >= waypoints.length) {
      return;
    }

    const currentWaypoint = waypoints[currentIndex];
    const previousWaypoint = currentIndex > 0 ? waypoints[currentIndex - 1] : null;

    // Mark previous waypoint as completed
    if (previousWaypoint && previousWaypoint.status !== 'completed') {
      await Waypoint.findByIdAndUpdate(previousWaypoint._id, {
        status: 'completed',
        reached_at: new Date()
      });
    }

    // Mark current waypoint as in-progress
    if (currentWaypoint.status !== 'completed') {
      await Waypoint.findByIdAndUpdate(currentWaypoint._id, {
        status: 'in-progress'
      });
    }

    // Update drone position
    if (mission.drone_id) {
      await Drone.findByIdAndUpdate(mission.drone_id._id, {
        current_latitude: currentWaypoint.latitude,
        current_longitude: currentWaypoint.longitude,
        current_altitude: currentWaypoint.altitude
      });

      // Simulate battery drain (1% per waypoint)
      const drone = await Drone.findById(mission.drone_id._id);
      if (drone) {
        const newBattery = Math.max(0, drone.battery_level - 1);
        await Drone.findByIdAndUpdate(mission.drone_id._id, {
          battery_level: newBattery
        });
      }
    }

    // Calculate progress
    const completedWaypoints = currentIndex;
    const progressPercentage = (completedWaypoints / waypoints.length) * 100;

    // Calculate distance covered
    let distanceCovered = 0;
    for (let i = 0; i < currentIndex && i < waypoints.length - 1; i++) {
      distanceCovered += WaypointGenerator.calculateDistance(
        waypoints[i].latitude,
        waypoints[i].longitude,
        waypoints[i + 1].latitude,
        waypoints[i + 1].longitude
      );
    }

    // Calculate flight duration
    const missionData = await Mission.findById(missionId);
    const startedAt = missionData?.started_at;
    const flightDuration = startedAt
      ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
      : 0;

    // Update mission
    await Mission.findByIdAndUpdate(missionId, {
      progress_percentage: parseFloat(progressPercentage.toFixed(2)),
      completed_waypoints: completedWaypoints,
      distance_covered_km: parseFloat(distanceCovered.toFixed(2)),
      flight_duration_seconds: flightDuration
    });

    // Log waypoint reached
    await MissionLog.create({
      mission_id: new mongoose.Types.ObjectId(missionId),
      log_type: 'waypoint_reached',
      message: `Reached waypoint ${currentIndex + 1}/${waypoints.length}`,
      metadata: {
        waypoint_id: currentWaypoint._id.toString(),
        sequence: currentIndex + 1,
        latitude: currentWaypoint.latitude,
        longitude: currentWaypoint.longitude
      }
    });

    // Emit real-time update
    this.io.emit('mission:update', {
      missionId,
      progress: progressPercentage.toFixed(2),
      completedWaypoints,
      totalWaypoints: waypoints.length,
      currentWaypoint: {
        latitude: currentWaypoint.latitude,
        longitude: currentWaypoint.longitude,
        altitude: currentWaypoint.altitude
      },
      distanceCovered: distanceCovered.toFixed(2),
      flightDuration
    });
  }

  /**
   * Complete mission
   */
  async completeMission(missionId, droneId) {
    try {
      // Mark all remaining waypoints as completed
      await Waypoint.updateMany(
        { mission_id: missionId, status: { $ne: 'completed' } },
        { status: 'completed' }
      );

      // Calculate final statistics
      const waypoints = await Waypoint.find({ mission_id: missionId })
        .sort({ sequence_number: 1 })
        .lean();

      let totalDistance = 0;
      for (let i = 0; i < waypoints.length - 1; i++) {
        totalDistance += WaypointGenerator.calculateDistance(
          waypoints[i].latitude,
          waypoints[i].longitude,
          waypoints[i + 1].latitude,
          waypoints[i + 1].longitude
        );
      }

      const missionData = await Mission.findById(missionId);
      const startedAt = missionData?.started_at;
      const flightDuration = startedAt
        ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
        : 0;

      // Estimate area coverage (simplified)
      const areaCoverage = 100.0; // Assume full coverage if completed

      // Update mission
      await Mission.findByIdAndUpdate(missionId, {
        status: 'completed',
        completed_at: new Date(),
        progress_percentage: 100.00,
        completed_waypoints: waypoints.length,
        distance_covered_km: parseFloat(totalDistance.toFixed(2)),
        flight_duration_seconds: flightDuration,
        area_coverage_percentage: areaCoverage
      });

      // Update drone status
      if (droneId) {
        await Drone.findByIdAndUpdate(droneId, {
          status: 'idle'
        });
      }

      // Log completion
      await MissionLog.create({
        mission_id: new mongoose.Types.ObjectId(missionId),
        log_type: 'status_change',
        message: 'Mission completed successfully',
        metadata: {
          flight_duration: flightDuration,
          distance_covered: totalDistance.toFixed(2),
          waypoints_completed: waypoints.length
        }
      });

      // Emit completion event
      this.io.emit('mission:update', {
        missionId,
        status: 'completed',
        progress: 100,
        message: 'Mission completed'
      });
    } catch (error) {
      console.error(`Failed to complete mission ${missionId}:`, error);
      throw error;
    }
  }

  /**
   * Pause mission
   */
  async pauseMission(missionId) {
    const intervalId = this.activeSimulations.get(missionId);
    if (intervalId) {
      clearInterval(intervalId);
      this.activeSimulations.delete(missionId);
    }

    await Mission.findByIdAndUpdate(missionId, {
      status: 'paused'
    });

    this.io.emit('mission:update', {
      missionId,
      status: 'paused',
      message: 'Mission paused'
    });
  }

  /**
   * Abort mission
   */
  async abortMission(missionId) {
    const intervalId = this.activeSimulations.get(missionId);
    if (intervalId) {
      clearInterval(intervalId);
      this.activeSimulations.delete(missionId);
    }

    // Get drone ID
    const mission = await Mission.findById(missionId);

    if (mission && mission.drone_id) {
      await Drone.findByIdAndUpdate(mission.drone_id, {
        status: 'idle'
      });
    }

    await Mission.findByIdAndUpdate(missionId, {
      status: 'aborted',
      completed_at: new Date()
    });

    this.io.emit('mission:update', {
      missionId,
      status: 'aborted',
      message: 'Mission aborted'
    });
  }
}
