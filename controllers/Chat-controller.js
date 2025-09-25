import { v4 as uuidv4 } from "uuid";
import ChatSession from "../models/chatSession-model.js";
import ChatSummary from "../models/Chat-summary-model.js";
import redisClient from "../config/redisClient.js";
import { encrypt } from "../config/encryption.js";

// Start a new chat session
export const startSession = async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ success: false, message: "Student ID required" });

    const sessionId = uuidv4();
    const now = new Date();

    req.session.studentId = studentId;
    req.session.sessionId = sessionId;
    req.session.chatHistory = [];
    req.session.consent = false;
    req.session.startedAt = now;

    // Save empty chat in Redis for live session
    await redisClient.set(`chat:${sessionId}`, JSON.stringify([]), { EX: 3600 });

    // Always create a ChatSession record
    await ChatSession.create({
      studentId,
      sessionId,
      consentGiven: false,
      startedAt: now,
    });

    res.json({ success: true, sessionId });
  } catch (err) {
    console.error("Error starting session:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add a message
export const addMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { sessionId } = req.session;

    if (!sessionId) return res.status(400).json({ success: false, message: "No active session" });

    req.session.chatHistory.push({ role: "student", message });

    // Update Redis
    await redisClient.set(`chat:${sessionId}`, JSON.stringify(req.session.chatHistory), { EX: 3600 });

    // Update ChatSession temporarily
    await ChatSession.findOneAndUpdate(
      { sessionId },
      { chatHistory: req.session.chatHistory }
    );

    res.json({ success: true, chatHistory: req.session.chatHistory });
  } catch (err) {
    console.error("Error adding message:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Give consent
export const giveConsent = async (req, res) => {
  try {
    const { sessionId } = req.session;
    req.session.consent = true;

    // Update consent in ChatSession
    await ChatSession.findOneAndUpdate(
      { sessionId },
      { consentGiven: true }
    );

    res.json({ success: true, message: "Consent recorded. Chats will be stored encrypted in MongoDB." });
  } catch (err) {
    console.error("Error giving consent:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// End session
export const endSession = async (req, res) => {
  try {
    const { studentId, sessionId, consent, startedAt, chatHistory } = req.session;
    if (!sessionId) return res.status(400).json({ success: false, message: "No active session" });

    const now = new Date();

    if (consent && chatHistory.length) {
      // Encrypt and save permanent chat
      const encryptedSummary = encrypt(JSON.stringify(chatHistory));
      await ChatSummary.create({
        user: studentId,
        sessionId,
        summary: encryptedSummary,
        startedAt: startedAt || now,
        endedAt: now,
      });
    }

    // Clear Redis + Express session
    await redisClient.del(`chat:${sessionId}`);
    req.session.destroy(() => {});

    res.json({ success: true, message: "Chat session ended and cleared." });
  } catch (err) {
    console.error("Error ending session:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


