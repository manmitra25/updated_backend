import express from "express";
import { getStudentAnalytics, getStudentPdf } from "../controllers/analytics-controller.js";

const router = express.Router();

router.get("/student/:studentId", getStudentAnalytics);
router.get("/student/:studentId/pdf", getStudentPdf);

export default router;
