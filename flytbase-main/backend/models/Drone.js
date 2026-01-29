import mongoose from 'mongoose';

const droneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  serial_number: {
    type: String,
    required: true,
    unique: true,
  },
  model: {
    type: String,
  },
  status: {
    type: String,
    enum: ['idle', 'in-mission', 'offline', 'maintenance'],
    default: 'idle',
  },
  battery_level: {
    type: Number,
    default: 100,
    min: 0,
    max: 100,
  },
  current_latitude: {
    type: Number,
  },
  current_longitude: {
    type: Number,
  },
  current_altitude: {
    type: Number,
  },
  location: {
    type: String,
  },
  health_status: {
    type: String,
    enum: ['healthy', 'warning', 'critical'],
    default: 'healthy',
  },
}, {
  timestamps: true,
});

droneSchema.index({ status: 1 });
droneSchema.index({ health_status: 1 });
droneSchema.index({ serial_number: 1 });

export default mongoose.model('Drone', droneSchema);

