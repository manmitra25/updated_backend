import express from "express";
import { saveTestResult, getTestResults } from "../controllers/test-Controller.js";
import {protect} from "../middleware/auth.js"

const router = express.Router();

// POST /api/tests/:type   (stress, depression, anxiety, burnout)
router.post("/:type",protect, saveTestResult);

// GET /api/tests/:type?studentId=123
router.get("/:type",protect, getTestResults);

export default router;