import express from "express";
import { getPHQ9Questions, addPHQ9QuestionsBulk ,submitPHQ9Test,getStudentPHQ9Responses } from "../controllers/phq9-controller.js";
import { adminAuth } from "../middleware/admin-middleware.js";

import { protect, volunteerProtect } from '../middleware/auth.js';
const router = express.Router();

// Public route: fetch all questions
router.get("/",protect ,getPHQ9Questions);



// Student: submit test
router.post("/submit", protect,submitPHQ9Test);

router.use(adminAuth);

// Admin-only route: add multiple questions at once
router.post("/bulk", adminAuth, addPHQ9QuestionsBulk);

// Optional: fetch student submissions
router.get("/responses/:studentId", adminAuth,getStudentPHQ9Responses);

export default router;
