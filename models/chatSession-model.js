import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    sessionId: { type: String, required: true, unique: true },
    consentGiven: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("ChatSession", chatSessionSchema);
