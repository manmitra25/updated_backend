import mongoose from "mongoose";
import MoodCheck from "../models/mood-model.js";
const { isValidObjectId } = mongoose;

// Helpers
function parseUtcDateOnly(yyyyMmDd) {
  const parts = String(yyyyMmDd).split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null; // invalid calendar date
  }
  return dt;
}

// POST /api/moods/check  (create today's or any day’s mood check)
// Body: { date: "YYYY-MM-DD", score: 1..6, note? }
export const createMoodCheck = async (req, res) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) return res.status(401).json({ message: "Not authenticated" });
    if (!isValidObjectId(studentId)) {
      return res.status(400).json({ message: "Invalid studentId" });
    }

    const { date, score, note } = req.body;

    if (!date || score == null) {
      return res.status(400).json({ message: "date and score are required" });
    }

    const dateOnly = parseUtcDateOnly(date);
    if (!dateOnly) {
      return res.status(400).json({ message: "Invalid date (expected YYYY-MM-DD)" });
    }

    const numScore = Number(score);
    if (!(numScore >= 1 && numScore <= 6)) {
      return res.status(400).json({ message: "score must be between 1 and 6" });
    }

    const doc = await MoodCheck.create({
      studentId,
      date: dateOnly,
      score: numScore,
      note,
    });

    return res.status(201).json({ message: "Mood check saved", mood: doc });
  } catch (error) {
    if (error?.code === 11000) {
      // unique index hit: already has a check for that date
      return res.status(409).json({ message: "Mood check for this date already exists" });
    }
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/moods/check  (update mood check for a date; creates if none if you prefer upsert=false by default)
export const updateMoodCheck = async (req, res) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) return res.status(401).json({ message: "Not authenticated" });
    if (!isValidObjectId(studentId)) {
      return res.status(400).json({ message: "Invalid studentId" });
    }

    const { date, score, note } = req.body;
    if (!date || score == null) {
      return res.status(400).json({ message: "date and score are required" });
    }

    const dateOnly = parseUtcDateOnly(date);
    if (!dateOnly) {
      return res.status(400).json({ message: "Invalid date (expected YYYY-MM-DD)" });
    }

    const numScore = Number(score);
    if (!(numScore >= 1 && numScore <= 6)) {
      return res.status(400).json({ message: "score must be between 1 and 6" });
    }

    const updated = await MoodCheck.findOneAndUpdate(
      { studentId, date: dateOnly },
      { $set: { score: numScore, note } },
      { new: true } // do not upsert by default; set { upsert: true } if desired
    );

    if (!updated) {
      return res.status(404).json({ message: "Mood check for this date not found" });
    }

    return res.status(200).json({ message: "Mood check updated", mood: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/moods/today
export const getTodayMood = async (req, res) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) return res.status(401).json({ message: "Not authenticated" });

    // compute "today" in UTC (same convention as we store)
    const now = new Date();
    const dateOnly = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(), 0, 0, 0, 0
    ));

    const mood = await MoodCheck.findOne({ studentId, date: dateOnly });
    return res.json({ mood });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/moods/me?from=YYYY-MM-DD&to=YYYY-MM-DD  (range query, inclusive)
export const getMyMoods = async (req, res) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) return res.status(401).json({ message: "Not authenticated" });

    const { from, to } = req.query;

    let q = { studentId };
    if (from || to) {
      const $gte = from ? parseUtcDateOnly(from) : null;
      const $lte = to ? parseUtcDateOnly(to) : null;
      if (from && !$gte) return res.status(400).json({ message: "Invalid from date" });
      if (to && !$lte) return res.status(400).json({ message: "Invalid to date" });

      q = {
        ...q,
        date: {
          ...( $gte ? { $gte } : {} ),
          ...( $lte ? { $lte } : {} ),
        },
      };
    }

    const moods = await MoodCheck.find(q).sort({ date: 1 });
    return res.json({ moods });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/moods/stats?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns count, average, min, max over the period
export const getMyMoodStats = async (req, res) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) return res.status(401).json({ message: "Not authenticated" });

    const { from, to } = req.query;
    const match = { studentId };

    if (from) {
      const f = parseUtcDateOnly(from);
      if (!f) return res.status(400).json({ message: "Invalid from date" });
      match.date = { ...(match.date || {}), $gte: f };
    }
    if (to) {
      const t = parseUtcDateOnly(to);
      if (!t) return res.status(400).json({ message: "Invalid to date" });
      match.date = { ...(match.date || {}), $lte: t };
    }

    const [agg] = await MoodCheck.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avg: { $avg: "$score" },
          min: { $min: "$score" },
          max: { $max: "$score" },
        },
      },
    ]);

    return res.json({
      stats: agg || { count: 0, avg: null, min: null, max: null },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/moods/:id  (optional admin/self-delete)
export const deleteMoodCheck = async (req, res) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) return res.status(401).json({ message: "Not authenticated" });

    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const deleted = await MoodCheck.findOneAndDelete({ _id: id, studentId });
    if (!deleted) return res.status(404).json({ message: "Mood check not found" });

    return res.json({ message: "Mood check deleted" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};
