import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  // NEW: direct link to community
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  // Keep author consistent with your app: Student (not User)
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  communityUsername: {
    type: String,
    required: true
  },
  replies: [{
    content: { type: String, required: true, maxlength: 2000 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    communityUsername: { type: String, required: true },
    repliedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  attachments: [{ type: String }],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  edited: {
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date }
  },
  pinned: { type: Boolean, default: false },
  reactions: [{
    emoji: { type: String, required: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    count: { type: Number, default: 0 }
  }]
}, { timestamps: true });

// NEW indexes
messageSchema.index({ community: 1, createdAt: -1 });
messageSchema.index({ author: 1 });

export default mongoose.model('Message', messageSchema);
