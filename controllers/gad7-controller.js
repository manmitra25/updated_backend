import GAD7Question from "../models/gad7-model.js";

export const getGAD7Questions = async (req, res) => {
  try {
    const questions = await GAD7Question.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addGAD7Question = async (req, res) => {
  try {
    const { question, options } = req.body;
    const newQuestion = await GAD7Question.create({ question, options });
    res.status(201).json(newQuestion);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
