import Booking, { BOOKING_TOPICS } from "../models/booking-model.js";
import mongoose from "mongoose";
const { isValidObjectId } = mongoose;

// helper: parse "HH:MM AM/PM" -> { hours, minutes }
function parseTimeStringToHM(timeStr) {
  // Accepts formats like "9:00 AM", "09:00AM", "12:30 pm"
  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*([APap][Mm])$/);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridian = match[3].toUpperCase();

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;

  if (meridian === "PM" && hours !== 12) hours += 12;
  if (meridian === "AM" && hours === 12) hours = 0;

  return { hours, minutes };
}

// helper: scheduled Date object in UTC using stored dateOnly (UTC midnight) + timeStr
function getScheduledDateTimeUTC(dateOnly, timeStr) {
  const hm = parseTimeStringToHM(timeStr);
  if (!hm) return null;
  const scheduled = new Date(dateOnly); // UTC midnight already
  scheduled.setUTCHours(hm.hours, hm.minutes, 0, 0);
  return scheduled;
}

export const bookTherapist = async (req, res) => {
  try {
    const { studentId, therapistId, date, time, sessionType, topic } = req.body;

    if (!studentId || !therapistId || !date || !time || !sessionType || !topic) {
      return res.status(400).json({ message: "studentId, therapistId, date, time, sessionType and topic are required" });
    }

    if (!BOOKING_TOPICS.includes(topic)) {
      return res.status(400).json({ message: "Invalid topic" });
    }

    // Validate ObjectIds early to avoid CastError -> 500
    if (!isValidObjectId(studentId)) {
      return res.status(400).json({ message: "Invalid studentId" });
    }
    if (!isValidObjectId(therapistId)) {
      return res.status(400).json({ message: "Invalid therapistId" });
    }

    // Strict date validation & UTC storage
    const ymd = String(date).split("-");
    if (ymd.length !== 3) {
      return res.status(400).json({ message: "Invalid date format (expected YYYY-MM-DD)" });
    }
    const [y, m, d] = ymd.map(Number);
    if (!y || !m || !d) {
      return res.status(400).json({ message: "Invalid date value" });
    }
    // Store as UTC midnight to avoid timezone drift
    const dateOnly = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

    // Validate time format
    const parsedHM = parseTimeStringToHM(time);
    if (!parsedHM) {
      return res.status(400).json({ message: "Invalid time format (expected HH:MM AM/PM)" });
    }

    // HARD RULE: same student must not book same therapist while active (any time slot)
    const activeWithSameTherapist = await Booking.findOne({
      studentId,
      therapistId,
      status: { $in: ["pending", "confirmed"] },
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
    });
    if (activeWithSameTherapist) {
      return res.status(400).json({ message: "You already have an active booking with this therapist." });
    }

    // Prevent double booking of therapist slot
    const existingBooking = await Booking.findOne({
      therapistId,
      date: dateOnly,
      time,
      status: { $in: ["pending", "confirmed"] },
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
    });
    if (existingBooking) {
      return res.status(400).json({ message: "This time slot is already booked." });
    }

    const blockMs = 10 * 60 * 1000;
    const booking = await Booking.create({
      studentId,
      therapistId,
      date: dateOnly,
      time,
      sessionType,
      topic,
      status: "pending",
      expiresAt: new Date(Date.now() + blockMs),
    });

    return res.status(201).json({
      message: "Booking created successfully. Please confirm within 10 minutes.",
      booking,
    });
  } catch (error) {
    // handle unique index violation gracefully
    if (error?.code === 11000) {
      return res.status(400).json({
        message: "You already have an active booking with this therapist.",
      });
    }
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};

export const confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ message: "bookingId is required" });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status !== "pending") {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }

    if (booking.expiresAt && booking.expiresAt < new Date()) {
      booking.status = "cancelled";
      await booking.save();
      return res.status(400).json({ message: "Booking expired" });
    }

    // Re-check duplicate active booking rule at confirm time (defensive)
    const hasAnotherActive = await Booking.findOne({
      _id: { $ne: booking._id },
      studentId: booking.studentId,
      therapistId: booking.therapistId,
      status: { $in: ["pending", "confirmed"] },
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
    });

    if (hasAnotherActive) {
      return res.status(400).json({ message: "You already have an active booking with this therapist." });
    }

    // Also make sure the exact slot wasn't taken in the meantime
    const slotTaken = await Booking.findOne({
      _id: { $ne: booking._id },
      therapistId: booking.therapistId,
      date: booking.date,
      time: booking.time,
      status: { $in: ["pending", "confirmed"] },
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
    });
    if (slotTaken) {
      return res.status(400).json({ message: "This time slot is already booked." });
    }

    booking.status = "confirmed";
    booking.expiresAt = undefined; // no longer needed
    await booking.save();

    return res.status(200).json({ message: "Booking confirmed", booking });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// NEW: Cancel booking (allowed only until 24 hours before the scheduled time)
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ message: "bookingId is required" });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({ message: `Cannot cancel a ${booking.status} booking` });
    }

    const scheduledAt = getScheduledDateTimeUTC(booking.date, booking.time);
    if (!scheduledAt) {
      return res.status(400).json({ message: "Invalid stored date/time" });
    }

    const now = new Date();
    const diffMs = scheduledAt.getTime() - now.getTime();

    if (diffMs <= 24 * 60 * 60 * 1000) {
      return res.status(400).json({ message: "Booking can only be cancelled at least 24 hours before the session." });
    }

    booking.status = "cancelled";
    booking.expiresAt = undefined;
    await booking.save();

    return res.status(200).json({ message: "Booking cancelled", booking });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};
