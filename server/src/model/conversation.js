const mongoose = require('mongoose');

const conversationMemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'accounts', required: true },
  lastRead: { type: Date, default: null },
  lastReadMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'messages', default: null },
  joinedAt: { type: Date, default: Date.now }
});


const conversationSchema = new mongoose.Schema({
  type: { type: String, enum: ['private', 'group'], required: true },
  members: { 
    type: [conversationMemberSchema], 
    required: true, 
    validate: { 
      validator: function(v) { return Array.isArray(v) && v.length > 0; }, 
      message: 'Conversation must have at least one member' 
    } 
  }
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'conversations', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'accounts', required: true },
  text: { type: String },
  attachments: { type: Array },
  readBy: [ { userId: { type: mongoose.Schema.Types.ObjectId }, readAt: { type: Date } } ]
}, { timestamps: true });

export const conversationModel = mongoose.model('conversations', conversationSchema);
export const messageModel = mongoose.model('messages', messageSchema);
