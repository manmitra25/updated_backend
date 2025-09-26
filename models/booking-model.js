import mongoose from "mongoose";

export const BOOKING_TOPICS = [
  "Self Improvement",
  "Sexual Wellness",
  "Abuse & Discrimination",
  "Academic",
  "Career",
  "LGBTQIA+",
  "Psychological Disorders",
  "Relationship",
];

const bookingSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    therapistId: { type: mongoose.Schema.Types.ObjectId, ref: "Therapist", required: true },

    date: { type: Date, required: true },     // stored as UTC midnight
    time: { type: String, required: true },   // "10:00 AM"

    sessionType: { type: String, enum: ["video", "chat", "offline", "call"], required: true },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },

    expiresAt: { type: Date },   // auto unblock after 10 mins if not confirmed
    bookedAt: { type: Date, default: Date.now },

    meetingLink: { type: String }, // for video/chat
    location: { type: String },    // for offline

    // NEW: topic
    topic: {
      type: String,
      enum: BOOKING_TOPICS,
      required: true,
    },
  },
  { timestamps: true }
);

// SPEED: index for "is this slot taken?" queries
bookingSchema.index({ therapistId: 1, date: 1, time: 1, status: 1 });

// RULE: a student may have at most one *active* (pending/confirmed) booking per therapist
bookingSchema.index(
  { studentId: 1, therapistId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "confirmed"] } },
  }
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
