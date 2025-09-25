import express from "express";
import { getGAD7Questions, addGAD7Question } from "../controllers/gad7-controller.js";

const router = express.Router();

router.get("/", getGAD7Questions);
router.post("/", addGAD7Question);

export default router;
