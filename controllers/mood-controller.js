import MoodQuestion from "../models/mood-model.js";

export const getMoodQuestions = async (req, res) => {
  try {
    const questions = await MoodQuestion.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addMoodQuestion = async (req, res) => {
  try {
    const { question, scaleMin, scaleMax } = req.body;
    const newQuestion = await MoodQuestion.create({ question, scaleMin, scaleMax });
    res.status(201).json(newQuestion);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
