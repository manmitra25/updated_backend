import mongoose from "mongoose";

const PHQ9QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ option: String, value: Number }], // e.g., 0-3 scale
});

const PHQ9Question = mongoose.model("PHQ9Question", PHQ9QuestionSchema);

export default PHQ9Question;
