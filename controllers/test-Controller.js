import Stress from "../models/stress.js";
import Depression from "../models/Depression.js";
import Anxiety from "../models/Anxiety.js";
import Burnout from "../models/Burnout.js";

// Save test result
export const saveTestResult = async (req, res) => {
  try {
    const { type } = req.params; // stress, depression, anxiety, burnout
    const { score } = req.body;
    
    
    let Model;
    if (type === "stress") Model = Stress;
    if (type === "depression") Model = Depression;
    if (type === "anxiety") Model = Anxiety;
    if (type === "burnout") Model = Burnout;
    
    if (!Model) return res.status(400).json({ message: "Invalid test type" });
    
    const studentId = req.user.id;

    const result = new Model({ studentId, score });
    await result.save();

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get latest test result by type
// Get latest test result for logged-in student
export const getTestResults = async (req, res) => {
  try {
    const { type } = req.params;

    let Model;
    if (type === "stress") Model = Stress;
    if (type === "depression") Model = Depression;
    if (type === "anxiety") Model = Anxiety;
    if (type === "burnout") Model = Burnout;

    if (!Model) return res.status(400).json({ message: "Invalid test type" });

    const studentId = req.user.id; // get studentId from logged-in user

    // Fetch latest test for this student
    const latestResult = await Model.findOne({ studentId }).sort({ date: -1 });

    if (!latestResult) return res.status(404).json({ message: "No test results found" });

    res.json(latestResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
