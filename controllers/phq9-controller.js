import PHQ9Question from "../models/phq9-model.js";

// Fetch all PHQ-9 questions
export const getPHQ9Questions = async (req, res) => {
  try {
    const questions = await PHQ9Question.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add multiple questions (admin only)
// Bulk insert PHQ-9 questions (admin only)
export const addPHQ9QuestionsBulk = async (req, res) => {
  try {
    const questionsArray = req.body; // expecting an array of questions
    if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
      return res.status(400).json({ message: "Invalid questions array" });
    }

    const inserted = await PHQ9Question.insertMany(questionsArray);
    res.status(201).json(inserted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



import PHQ9Response from "../models/phq9-response-model.js";

// Student submits their test
export const submitPHQ9Test = async (req, res) => {
  try {
    const { studentId, answers } = req.body;

    if (!studentId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Invalid submission" });
    }

    // Calculate total score
    const score = answers.reduce((total, ans) => total + ans.value, 0);

    const response = await PHQ9Response.create({
      studentId,
      answers,
      phq9_score
    });

    res.status(201).json({
      message: "Test submitted successfully",
      phq9_score,
      responseId: response._id
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Optional: Fetch student's previous submissions
export const getStudentPHQ9Responses = async (req, res) => {
  try {
    const { studentId } = req.params;
    const responses = await PHQ9Response.find({ studentId }).populate("answers.questionId");
    res.json(responses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

