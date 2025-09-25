import mongoose from "mongoose";

const therapistSessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    therapistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
    },
    sessionDate: { type: Date, default: Date.now },
    notes: { type: String, default: "" }, // therapist’s session summary
  },
  { timestamps: true }
);

const TherapistSession = mongoose.model("TherapistSession", therapistSessionSchema);
export default TherapistSession;
