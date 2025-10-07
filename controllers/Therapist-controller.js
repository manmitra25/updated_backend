// controllers/auth-therapist.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Therapist from "../models/Therapist-model.js";
import redisClient from "../config/redisClient.js";

/** Normalize "time" strings to canonical "H:MM AM/PM" format.
 *  Accepts variants like "9:00am", "09:00 AM", "  12:30 pm  ", etc.
 *  Returns null if invalid.
 */
function normalizeTimeLabel(label) {
  if (label == null) return null;
  const m = String(label).trim().match(/^(\d{1,2})\s*:\s*([0-5]\d)\s*([APap][Mm])$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const mm = m[2];
  const ap = m[3].toUpperCase(); // AM/PM

  if (h < 1 || h > 12) return null;
  // Canonical string (do not convert to 24h; we store the display label)
  return `${h}:${mm} ${ap}`;
}

// ================= Signup Therapist =================
export const signupTherapist = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      specialization,
      experience,
      dailyTimes,     // NEW
      availability,   // legacy (optional)
    } = req.body;

    // Basic required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, and password are required" });
    }

    // Check if already exists
    const existing = await Therapist.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Therapist already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // --- sanitize dailyTimes (NEW) ---
    let normalizedDailyTimes = [];
    if (Array.isArray(dailyTimes)) {
      const cleaned = dailyTimes
        .map(normalizeTimeLabel)
        .filter(Boolean); // remove invalid/null

      // de-duplicate while preserving order
      const seen = new Set();
      normalizedDailyTimes = cleaned.filter((t) => (seen.has(t) ? false : (seen.add(t), true)));
    }

    // --- sanitize legacy availability (date + times) ---
    let normalizedAvailability = [];
    if (Array.isArray(availability)) {
      normalizedAvailability = availability.map((a) => {
        const dateISO = new Date(a?.date || "");
        // normalize to UTC midnight
        const d0 = isNaN(dateISO.getTime())
          ? null
          : new Date(Date.UTC(
              dateISO.getUTCFullYear(),
              dateISO.getUTCMonth(),
              dateISO.getUTCDate(), 0, 0, 0, 0
            ));

        // normalize each time label
        const times = Array.isArray(a?.times)
          ? a.times.map(normalizeTimeLabel).filter(Boolean)
          : [];

        return d0
          ? { date: d0, times: Array.from(new Set(times)) }
          : null;
      }).filter(Boolean);
    }

    const therapist = await Therapist.create({
      name,
      email,
      password: hashedPassword,
      specialization,
      status: "pending",                 // ALWAYS pending on signup
      experience: experience || undefined,
      dailyTimes: normalizedDailyTimes,  // NEW
      availability: normalizedAvailability, // legacy optional
      // rating stays default (never accept from client)
    });

    res
      .status(201)
      .json({ message: "Signup successful. Waiting for Admin approval.", therapist });
  } catch (error) {
    res.status(500).json({ message: "Error signing up Therapist", error: error.message });
  }
};

// ================= Login Therapist =================
export const loginTherapist = async (req, res) => {
  try {
    const { email, password } = req.body;

    const therapist = await Therapist.findOne({ email });
    if (!therapist) {
      return res.status(404).json({ message: "Therapist not found" });
    }

    // Check if approved
    if (therapist.status !== "approved") {
      return res.status(403).json({ message: "Your account is not approved yet" });
    }

    const isMatch = await bcrypt.compare(password, therapist.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: therapist._id, role: "therapist" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Save session in Redis (optional)
    try {
      await redisClient.set(`therapist:${therapist._id}`, token, { EX: 3600 });
    } catch (e) {
      // non-fatal if redis is down; just log
      console.error("Redis set failed:", e.message);
    }

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in Therapist", error: error.message });
  }
};
