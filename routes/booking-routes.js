import express from "express";
import { bookTherapist, confirmBooking } from "../controllers/booking-controller.js";

const router = express.Router();

// POST /api/bookings/book
router.post("/book", bookTherapist);

// POST /api/bookings/confirm
router.post("/confirm", confirmBooking);

export default router;
