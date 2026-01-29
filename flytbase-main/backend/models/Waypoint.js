import mongoose from 'mongoose';

const waypointSchema = new mongoose.Schema({
  mission_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
    required: true,
  },
  sequence_number: {
    type: Number,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  altitude: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'skipped'],
    default: 'pending',
  },
  reached_at: {
    type: Date,
  },
}, {
  timestamps: true,
});

waypointSchema.index({ mission_id: 1, sequence_number: 1 });

export default mongoose.model('Waypoint', waypointSchema);

