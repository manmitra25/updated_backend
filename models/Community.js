import mongoose from 'mongoose';
import Student from './student-model.js'; // <-- correct model

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Love', 'Money', 'Education', 'Stress', 'Motivation', 'Unfiltered', 'Other']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Volunteer',
    required: true
  },
  isPreCreated: {
    type: Boolean,
    default: false
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student' // <-- changed from 'User' to 'Student'
    },
    username: {
      type: String,
      required: false
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  channels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  }],
  rules: [{
    type: String
  }],
  avatar: {
    type: String,
    default: ''
  },
  banner: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance
communitySchema.index({ name: 'text', description: 'text' });
communitySchema.index({ category: 1 });

export default mongoose.model('Community', communitySchema);
