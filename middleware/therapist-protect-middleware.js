// middleware/therapist-protect-middleware.js
import Therapist from "../models/Therapist-model.js";

export const protectTherapist  = async (req, res, next) => {
  try {
    console.log("Inside therapistProtect, req.user:", req.user);

    if (!req.user || !req.user.therapistId) {
      return res.status(403).json({ message: "Not authorized as a therapist" });
    }

    // Fetch full therapist doc
    const therapist = await Therapist.findById(req.user.therapistId);
    if (!therapist) {
      return res.status(403).json({ message: "Not authorized as a therapist" });
    }

    console.log("Therapist found:", therapist);
    req.user.therapistDoc = therapist; // optional: full doc for later use
    next();
  } catch (error) {
    console.error("therapistProtect error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
