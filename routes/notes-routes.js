// routes/therapist-session-routes.js
import express from "express";
import { protect } from "../middleware/auth.js";
import { protectTherapist } from "../middleware/therapist-protect-middleware.js";
import {
  saveTherapistNotes,
  getLastTherapistNotes,
  getTherapistSessionView
} from "../controllers/notes-controller.js";

const router = express.Router();

router.get("/session/:bookingId", protect, protectTherapist, getTherapistSessionView);
// Save notes for a booking
router.post("/session/:bookingId/notes", protect, protectTherapist, saveTherapistNotes);
router.get("/notes/:studentId/last", protect, protectTherapist, getLastTherapistNotes);

export default router;
