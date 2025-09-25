// controllers/curd-chat-controller.js
import ChatSummary from "../models/Chat-summary-model.js";
import Student from "../models/student-model.js";
import { decrypt } from "../config/encryption.js";

export const getChatsForStudent = async (req, res) => {
  try {
    let studentId = req.params.studentId || req.body.studentId;

    // Trim whitespace/newlines
    studentId = studentId.trim();

    // Check if valid ObjectId
    if (!studentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Fetch all chat summaries for this student
    const chats = await ChatSummary.find({ user: studentId });

    // Decrypt summaries before sending
    const decryptedChats = chats.map(chat => ({
      ...chat.toObject(),
      summary: decrypt(chat.summary),
    }));

    res.json({ success: true, chats: decryptedChats });
  } catch (err) {
    console.error("Error fetching chats for student:", err);
    res.status(500).json({ message: err.message });
  }
};
