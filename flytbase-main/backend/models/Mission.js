import mongoose from 'mongoose';

const missionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  drone_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drone',
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'paused', 'completed', 'aborted'],
    default: 'scheduled',
  },
  mission_type: {
    type: String,
    enum: ['grid', 'perimeter', 'crosshatch', 'custom'],
    default: 'grid',
  },
  altitude: {
    type: Number,
    required: true,
  },
  overlap_percentage: {
    type: Number,
    default: 70.0,
  },
  sensor_type: {
    type: String,
  },
  sensor_frequency: {
    type: Number,
  },
  survey_area_polygon: {
    type: mongoose.Schema.Types.Mixed,
  },
  scheduled_start_time: {
    type: Date,
  },
  started_at: {
    type: Date,
  },
  completed_at: {
    type: Date,
  },
  progress_percentage: {
    type: Number,
    default: 0.0,
  },
  total_waypoints: {
    type: Number,
    default: 0,
  },
  completed_waypoints: {
    type: Number,
    default: 0,
  },
  flight_duration_seconds: {
    type: Number,
    default: 0,
  },
  distance_covered_km: {
    type: Number,
    default: 0.0,
  },
  area_coverage_percentage: {
    type: Number,
    default: 0.0,
  },
}, {
  timestamps: true,
});

missionSchema.index({ status: 1 });
missionSchema.index({ drone_id: 1 });
missionSchema.index({ created_by: 1 });

export default mongoose.model('Mission', missionSchema);

