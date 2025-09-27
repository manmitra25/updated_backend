import mongoose from "mongoose";

const moodCheckSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    // Store day as a Date at UTC midnight (no time component)
    date: { type: Date, required: true },
    // Mood score 1..6
    score: { type: Number, min: 1, max: 6, required: true },
    // Optional note/comment if you ever want it
    note: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

// One mood check per student per day
moodCheckSchema.index({ studentId: 1, date: 1 }, { unique: true });

// Optional speed index for range queries
moodCheckSchema.index({ studentId: 1, date: -1 });

const MoodCheck = mongoose.model("MoodCheck", moodCheckSchema);
export default MoodCheck;
