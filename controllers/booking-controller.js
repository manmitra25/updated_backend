// src/controllers/booking-controller.js
import mongoose from "mongoose";
import Therapist from "../models/Therapist-model.js";
import Student from "../models/student-model.js";
import { sendBookingEmails } from "../utils/mailer.js";
import Booking, { BOOKING_TOPICS } from "../models/booking-model.js";
const { isValidObjectId } = mongoose;

// helpers (as you have them)
function parseTimeStringToHM(timeStr) {
  if (timeStr == null) return null;
  // Allow leading/trailing spaces, optional spaces around ":", any am/pm case
  const m = String(timeStr)
    .trim()
    .match(/^\s*(\d{1,2})\s*:\s*(\d{2})\s*([APap][Mm])\s*$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const mins = parseInt(m[2], 10);
  const ap = m[3].toUpperCase();

  if (h < 1 || h > 12 || mins < 0 || mins > 59) return null;
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return { hours: h, minutes: mins };
}
function getScheduledDateTimeUTC(dateOnly, timeStr) {
  const hm = parseTimeStringToHM(timeStr);
  if (!hm) return null;
  const d = new Date(dateOnly); // dateOnly is UTC midnight
  d.setUTCHours(hm.hours, hm.minutes, 0, 0);
  return d;
}

// (Optional) enforce time is in therapist availability for that day
// Prefer dailyTimes (applies every day). If empty, fall back to per-date availability.
async function ensureTimeInTherapistAvailability(
  therapistId,
  dateOnly,
  timeLabel
) {
  const therapist = await Therapist.findById(therapistId).lean();
  if (!therapist) return { ok: false, msg: "Therapist not found" };

  const normalize = (s) => String(s).trim().toUpperCase();

  // 1) If dailyTimes exist, use them for all days
  if (Array.isArray(therapist.dailyTimes) && therapist.dailyTimes.length > 0) {
    const allowed = new Set(therapist.dailyTimes.map(normalize));
    if (!allowed.has(normalize(timeLabel))) {
      return {
        ok: false,
        msg: "Selected time is not in therapist's daily availability",
      };
    }
    return { ok: true };
  }

  // 2) Fallback: per-date availability (legacy)
  const sameUtcDay = (a, b) =>
    new Date(a).getUTCFullYear() === new Date(b).getUTCFullYear() &&
    new Date(a).getUTCMonth() === new Date(b).getUTCMonth() &&
    new Date(a).getUTCDate() === new Date(b).getUTCDate();

  const avail = (therapist.availability || []).find((a) =>
    sameUtcDay(a.date, dateOnly)
  );
  if (!avail || !Array.isArray(avail.times) || avail.times.length === 0) {
    return {
      ok: false,
      msg: "Therapist is not available on the selected date",
    };
  }
  const allowed = new Set(avail.times.map(normalize));
  if (!allowed.has(normalize(timeLabel))) {
    return {
      ok: false,
      msg: "Selected time is not in therapist's availability",
    };
  }
  return { ok: true };
}

export const bookTherapist = async (req, res) => {
  try {
    const studentId = req.user?.id; // ← from auth middleware
    if (req.user?.role !== "student") {
      return res
        .status(403)
        .json({ message: "Only students can perform this action" });
    }
    const { therapistId, date, time, sessionType, topic } = req.body;

    if (!studentId)
      return res.status(401).json({ message: "Not authenticated" });
    if (!therapistId || !date || !time || !sessionType || !topic) {
      return res
        .status(400)
        .json({
          message:
            "therapistId, date, time, sessionType and topic are required",
        });
    }
    if (!BOOKING_TOPICS.includes(topic)) {
      return res.status(400).json({ message: "Invalid topic" });
    }
    if (!isValidObjectId(studentId))
      return res.status(400).json({ message: "Invalid studentId" });
    if (!isValidObjectId(therapistId))
      return res.status(400).json({ message: "Invalid therapistId" });

    // date -> UTC midnight
    const ymd = String(date).split("-");
    if (ymd.length !== 3)
      return res
        .status(400)
        .json({ message: "Invalid date format (expected YYYY-MM-DD)" });
    const [y, m, d] = ymd.map(Number);
    if (!y || !m || !d)
      return res.status(400).json({ message: "Invalid date value" });
    const dateOnly = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

    // time format
    if (!parseTimeStringToHM(time)) {
      return res
        .status(400)
        .json({ message: "Invalid time format (expected HH:MM AM/PM)" });
    }

    // (Optional) enforce availability times
    const check = await ensureTimeInTherapistAvailability(
      therapistId,
      dateOnly,
      time
    );
    if (!check.ok) return res.status(400).json({ message: check.msg });

    // no active booking with same therapist
    const activeWithSameTherapist = await Booking.findOne({
      studentId,
      therapistId,
      status: { $in: ["pending", "confirmed"] },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    });
    if (activeWithSameTherapist) {
      return res
        .status(400)
        .json({
          message: "You already have an active booking with this therapist.",
        });
    }

    // lock slot (pending/confirmed, not expired)
    const existingBooking = await Booking.findOne({
      therapistId,
      date: dateOnly,
      time,
      status: { $in: ["pending", "confirmed"] },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    });
    if (existingBooking) {
      return res
        .status(400)
        .json({ message: "This time slot is already booked." });
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
      message:
        "Booking created successfully. Please confirm within 10 minutes.",
      booking,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res
        .status(400)
        .json({
          message: "You already have an active booking with this therapist.",
        });
    }
    if (error?.name === "CastError") {
      return res.status(400).json({ message: `Invalid ${error.path}` });
    }
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};

export const confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId)
      return res.status(400).json({ message: "bookingId is required" });
    if (!isValidObjectId(bookingId))
      return res.status(400).json({ message: "Invalid bookingId" });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status !== "pending") {
      return res
        .status(400)
        .json({ message: `Booking is already ${booking.status}` });
    }
    if (booking.expiresAt && booking.expiresAt < new Date()) {
      booking.status = "cancelled";
      await booking.save();
      return res.status(400).json({ message: "Booking expired" });
    }

    // race-safety checks
    const hasAnotherActive = await Booking.findOne({
      _id: { $ne: booking._id },
      studentId: booking.studentId,
      therapistId: booking.therapistId,
      status: { $in: ["pending", "confirmed"] },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    });
    if (hasAnotherActive) {
      return res
        .status(400)
        .json({
          message: "You already have an active booking with this therapist.",
        });
    }

    const slotTaken = await Booking.findOne({
      _id: { $ne: booking._id },
      therapistId: booking.therapistId,
      date: booking.date,
      time: booking.time,
      status: { $in: ["pending", "confirmed"] },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    });
    if (slotTaken) {
      return res
        .status(400)
        .json({ message: "This time slot is already booked." });
    }

    booking.status = "confirmed";
    booking.expiresAt = undefined;
    await booking.save();

      // Fetch recipient info
   const [student, therapist] = await Promise.all([
     Student.findById(booking.studentId).lean(),
     Therapist.findById(booking.therapistId).lean(),
   ]);
   // Build simple labels. Your date is stored as a UTC date-only and time is a label like "10:00 AM".
   const dateLabel = booking.date.toISOString().slice(0, 10); // "YYYY-MM-DD"
   const timeLabel = booking.time; // already "HH:MM AM/PM"

   // Send emails. If this fails, we still return 200 but log the error.
try {
  await sendBookingEmails({
  studentEmail: student?.email || null,
  studentName: student?.name || "Student",
  therapistEmail: therapist?.email || null,
  therapistName: therapist?.name || "Therapist",
  dateLabel, timeLabel,
  timezone: booking.timezone || "UTC",
  sessionType: booking.sessionType,
  topic: booking.topic,
  joinLink: booking.joinLink,
  locationAddress: booking.locationAddress,
  manageLink: null
});

} catch (mailErr) {
  console.error("Failed to send booking emails:", mailErr);
}


    return res.status(200).json({ message: "Booking confirmed", booking });
  } catch (error) {
    if (error?.name === "CastError") {
      return res.status(400).json({ message: `Invalid ${error.path}` });
    }
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// src/controllers/booking-controller.js

export const cancelBooking = async (req, res) => {
  try {
    const studentId = req.user?.id; // set by protect middleware
    const { bookingId } = req.body;

    if (!studentId) return res.status(401).json({ message: "Not authenticated" });
    if (!bookingId) return res.status(400).json({ message: "bookingId is required" });
    if (!isValidObjectId(bookingId)) return res.status(400).json({ message: "Invalid bookingId" });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // ownership check
    if (String(booking.studentId) !== String(studentId)) {
      return res.status(403).json({ message: "You can only cancel your own booking" });
    }

    // Only allow cancelling when status is pending or confirmed
    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({ message: `Cannot cancel a ${booking.status} booking` });
    }

    // 24-hour window rule: must be > 24h before the scheduled start time
    const scheduledAt = getScheduledDateTimeUTC(booking.date, booking.time); // uses your helpers
    if (!scheduledAt) return res.status(400).json({ message: "Invalid stored date/time" });

    const diffMs = scheduledAt.getTime() - Date.now();
    if (diffMs <= 24 * 60 * 60 * 1000) {
      return res.status(400).json({
        message: "Booking can only be cancelled at least 24 hours before the session.",
      });
    }

    // cancel it (free the slot)
    booking.status = "cancelled";
    booking.expiresAt = undefined; // no longer relevant
    await booking.save();

    return res.status(200).json({ message: "Booking cancelled", booking });
  } catch (error) {
    if (error?.name === "CastError") {
      return res.status(400).json({ message: `Invalid ${error.path}` });
    }
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const getMyBookings = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId)
      return res.status(401).json({ message: "Not authenticated" });

    const bookings = await Booking.find({ studentId })
      .sort({ date: -1, createdAt: -1 })
      .lean();
    res.json({ bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
