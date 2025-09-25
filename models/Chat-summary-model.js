import mongoose from "mongoose";

const chatSummarySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    sessionId: { type: String, required: true },
    summary: { type: String, required: true }, // encrypted chat
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("ChatSummary", chatSummarySchema);
