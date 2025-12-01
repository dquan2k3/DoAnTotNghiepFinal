const mongoose = require('mongoose');

const relationshipSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'accounts', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'accounts', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'blocked'],
    default: 'pending'
  },
  message: { type: String },
  acceptedAt: { type: Date },
  wasRejected: { type: Boolean, default: false },
  blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'accounts' },
  isFollow: { type: Boolean, default: false },
  interactionCount: { type: Number, default: 0 },
  lastInteractionAt: { type: Date }
}, { timestamps: true });

relationshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });

const Relationship = mongoose.model('relationship', relationshipSchema);

module.exports = { Relationship };
