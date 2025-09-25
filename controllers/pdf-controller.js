// controllers/pdf-controller.js
import PDFDocument from "pdfkit";
import ChatSummary from "../models/Chat-summary-model.js";
import Student from "../models/student-model.js";
import { decrypt } from "../config/encryption.js";

export const generateStudentChatPDF = async (req, res) => {
  try {
    let studentId = req.params.studentId || req.user.id;
    studentId = studentId.trim();

    // Validate ObjectId
    if (!studentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const chats = await ChatSummary.find({ user: studentId }).sort({ startedAt: 1 });
    if (!chats.length) return res.status(404).json({ message: "No chats found for this student" });

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    // Headers for response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${student.email}_chats.pdf"`
    );

    doc.pipe(res);

    // Document Title
    doc.fontSize(22).fillColor("#000").text(`Chat Summary for ${student.email}`, {
      underline: true,
      align: "center",
    });
    doc.moveDown(1.5);

    // Iterate sessions
    chats.forEach((chat, idx) => {
      const summary = decrypt(chat.summary);
      const messages = JSON.parse(summary);

      doc.fontSize(16).fillColor("#1f4e79").text(`Session ${idx + 1}`, { underline: true });
      doc.fontSize(12).fillColor("black").text(`Session ID: ${chat.sessionId}`);
      doc.text(`Started At: ${chat.startedAt}`);
      doc.text(`Ended At: ${chat.endedAt}`);
      doc.moveDown(0.5);

      // Chat messages
      messages.forEach((msg, i) => {
        const roleColor = msg.role === "student" ? "#2a9d8f" : "#e76f51";
        doc.fillColor(roleColor).font("Helvetica-Bold").text(`${msg.role.toUpperCase()}:`, { continued: true });
        doc.fillColor("black").font("Helvetica").text(` ${msg.message}`);
        if ((i + 1) % 25 === 0) doc.addPage(); // Avoid overflow
      });

      doc.addPage(); // New page per session
    });

    doc.end();
  } catch (err) {
    console.error("Error generating PDF:", err);
    res.status(500).json({ message: err.message });
  }
};
