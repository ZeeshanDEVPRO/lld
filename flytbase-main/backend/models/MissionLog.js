import mongoose from 'mongoose';

const missionLogSchema = new mongoose.Schema({
  mission_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
    required: true,
  },
  log_type: {
    type: String,
    enum: ['status_change', 'waypoint_reached', 'battery_update', 'error', 'control_action'],
    required: true,
  },
  message: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

missionLogSchema.index({ mission_id: 1 });
missionLogSchema.index({ log_type: 1 });
missionLogSchema.index({ created_at: -1 });

export default mongoose.model('MissionLog', missionLogSchema);

