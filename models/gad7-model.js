import mongoose from "mongoose";

const GAD7QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ option: String, value: Number }],
});

const GAD7Question = mongoose.model("GAD7Question", GAD7QuestionSchema);

export default GAD7Question;
