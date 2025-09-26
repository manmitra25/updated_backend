import mongoose from "mongoose";

const MoodQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  scaleMin: { type: Number, default: 0 },
  scaleMax: { type: Number, default: 10 },
});


// date
// mood 

const MoodQuestion = mongoose.model("MoodQuestion", MoodQuestionSchema);

export default MoodQuestion;
