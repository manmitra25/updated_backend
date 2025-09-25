import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    therapistId: { type: mongoose.Schema.Types.ObjectId, ref: "Therapist", required: true },

    // Separate date & time (easier for querying available slots)
    date: { type: Date, required: true }, // from Date picker
    time: { type: String, required: true }, // e.g., "10:00 AM"

    sessionType: {
      type: String,
      enum: ["video", "chat", "offline"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },

    expiresAt: { type: Date }, // auto unblock after 10 mins if not confirmed

    //  To track when the booking was made (important for auditing & analytics)
    bookedAt: { type: Date, default: Date.now },

    // Optional: session link or meeting location
    meetingLink: { type: String }, // for video/chat
    location: { type: String }, // for offline sessions
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
