import mongoose from "mongoose";

const PHQ9ResponseSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  answers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: "PHQ9Question" },
      value: { type: Number, required: true } // 0-3
    }
  ],
  phq9_score: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const PHQ9Response = mongoose.model("PHQ9Response", PHQ9ResponseSchema);

export default PHQ9Response;
