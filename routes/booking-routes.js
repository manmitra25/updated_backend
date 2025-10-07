import express from "express";
import { bookTherapist, confirmBooking, cancelBooking,getMyBookings } from "../controllers/booking-controller.js";
import Booking from "../models/booking-model.js";
import {protect} from "../middleware/auth.js"


const router = express.Router();

// POST /api/bookings/book
router.post("/book", protect,bookTherapist);

// POST /api/bookings/confirm
router.post("/confirm",protect, confirmBooking);

// POST /api/bookings/cancel
router.post("/cancel", protect,cancelBooking);

router.get("/me", protect, getMyBookings);

// Get bookings by student
router.get("/student/:studentId", async (req, res) => {
  try {
    const bookings = await Booking.find({ studentId: req.params.studentId }).sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// Get bookings by therapist
router.get("/therapist/:therapistId", async (req, res) => {
  try {
    const bookings = await Booking.find({ therapistId: req.params.therapistId }).sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
