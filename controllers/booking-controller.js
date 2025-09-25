import Booking from "../models/booking-model.js";

// Book therapist
export const bookTherapist = async (req, res) => {
  try {
    const { studentId, therapistId, date, time, sessionType } = req.body;

    if (!date || !time || !sessionType) {
      return res.status(400).json({ message: "Date, time and session type are required" });
    }

    // Block duration = 10 minutes
    const blockDuration = 10 * 60 * 1000;
    const expiryTime = new Date(Date.now() + blockDuration);

    // Check if already booked for same therapist, date, and time
    const existingBooking = await Booking.findOne({
      therapistId,
      date,
      time,
      status: { $in: ["pending", "confirmed"] },
      expiresAt: { $gt: new Date() },
    });

    if (existingBooking) {
      return res.status(400).json({ message: "This time slot is already booked." });
    }

    // Create new booking
    const booking = new Booking({
      studentId,
      therapistId,
      date,
      time,
      sessionType,
      expiresAt: expiryTime,
      status: "pending",
    });

    await booking.save();
    res.status(201).json({
      message: "Booking created successfully. Please confirm within 10 minutes.",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


// Confirm booking
export const confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.expiresAt < new Date()) {
      booking.status = "cancelled";
      await booking.save();
      return res.status(400).json({ message: "Booking expired" });
    }

    booking.status = "confirmed";
    await booking.save();

    res.status(200).json({ message: "Booking confirmed", booking });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
