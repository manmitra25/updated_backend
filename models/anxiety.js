// models/Anxiety.js
import mongoose from "mongoose";

const anxietySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  date: { type: Date, default: Date.now },
  score: { type: Number, required: true }
});

export default mongoose.model("Anxiety", anxietySchema);
