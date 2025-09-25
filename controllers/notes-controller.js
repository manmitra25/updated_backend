// controllers/notes-controller.js
import Booking from "../models/booking-model.js";
import TherapistSession from "../models/Notes-model.js";

/**
 * 1️⃣ Get therapist session view for a booking
 * Returns booking info, last notes, and student chat PDF link
 */
export const getTherapistSessionView = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("therapistId", "email");

    if (!booking || booking.status !== "confirmed") {
      return res.status(404).json({ success: false, message: "Booking not found or not confirmed" });
    }

    // Build sessionDate from date + time
    const sessionDateTime = new Date(booking.date);
    // optional: parse booking.time ("10:00 AM") to adjust hours if needed

    const lastNotes = await TherapistSession.findOne({
      studentId: booking.studentId,
    }).sort({ sessionDate: -1 });

    res.json({
      success: true,
      booking,
      lastNotes,
      chatPdfLink: `http://localhost:5000/api/chat/student/${booking.studentId}/pdf`,
    });
  } catch (err) {
    console.error("Error fetching therapist session view:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


/**
 * 2️⃣ Save new therapist notes
 * Attach notes to a booking and student
 */
export const saveTherapistNotes = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { notes } = req.body;
    const therapistId = req.user.id;

    if (!notes) {
      return res.status(400).json({ success: false, message: "Notes are required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking || booking.status !== "confirmed") {
      return res.status(404).json({ success: false, message: "Booking not found or not confirmed" });
    }

    // Build session date-time from booking date + time
    const sessionDateTime = new Date(booking.date);

    const session = await TherapistSession.create({
      studentId: booking.studentId,
      therapistId,
      notes,
      sessionDate: sessionDateTime,
      bookingId,
    });

    res.status(201).json({ success: true, session });
  } catch (err) {
    console.error("Error saving therapist notes:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 3️⃣ Get last therapist notes for a student (optional)
 */
export const getLastTherapistNotes = async (req, res) => {
  try {
    const { studentId } = req.params;

    const lastNotes = await TherapistSession.findOne({ studentId })
      .sort({ sessionDate: -1 });

    if (!lastNotes) {
      return res.status(404).json({ success: false, message: "No previous therapist session found" });
    }

    res.json({ success: true, lastNotes });
  } catch (err) {
    console.error("Error fetching last therapist notes:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
