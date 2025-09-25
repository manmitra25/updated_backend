import express from "express";
import { startSession, addMessage, giveConsent, endSession } from "../controllers/Chat-controller.js";

import { protect, volunteerProtect } from '../middleware/auth.js';

import { generateStudentChatPDF } from "../controllers/pdf-controller.js";

const router = express.Router();

router.post("/start", startSession);   // start a new chatbot session
router.post("/message", addMessage);   // send a message
router.post("/consent", giveConsent);  // student gives consent
router.post("/end", endSession);       // end chat



import { getChatsForStudent } from "../controllers/curd-chat-controller.js";
import { protectTherapist } from "../middleware/therapist-protect-middleware.js";


// Fetch all chats for a student (therapist only)
router.get("/student/:studentId",protect ,protectTherapist, getChatsForStudent);

// Only therapists can download PDFs
router.get("/student/:studentId/pdf", protect, protectTherapist, generateStudentChatPDF);


export default router;
