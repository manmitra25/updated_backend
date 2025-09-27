import express from "express";
import {
  createMoodCheck,
  updateMoodCheck,
  getTodayMood,
  getMyMoods,
  getMyMoodStats,
  deleteMoodCheck,
} from "../controllers/mood-controller.js";

// IMPORTANT: protect with your auth middleware so req.user is set
// e.g., import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// router.use(requireAuth); // uncomment when you have auth middleware

// Create a mood check for a date (default: one per day; 409 if exists)
router.post("/check", createMoodCheck);

// Update an existing mood check for a date (by date)
router.put("/check", updateMoodCheck);

// Get today's mood (if exists)
router.get("/today", getTodayMood);

// Get my moods (optionally by date range)
router.get("/me", getMyMoods);

// Aggregate stats (count/avg/min/max) over a range
router.get("/stats", getMyMoodStats);

// Delete by id (optional)
router.delete("/:id", deleteMoodCheck);

export default router;
