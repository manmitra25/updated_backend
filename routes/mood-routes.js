import express from "express";
import { getMoodQuestions, addMoodQuestion } from "../controllers/mood-controller.js";

const router = express.Router();

router.get("/", getMoodQuestions);
router.post("/", addMoodQuestion);

export default router;
