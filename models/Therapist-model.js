import mongoose from "mongoose";

const therapistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    specialization: { type: String }, 
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    
    experience: { type: String, default: "3 years" },
     //  Rating
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },

      // NEW: daily recurring times (apply to every day)
    dailyTimes: {
      type: [String],          // e.g., ["10:00 AM", "2:00 PM", "5:00 PM"]
      default: [],
    },
    // Availability merged here
    availability: [
      {
        date: { type: Date, required: true },
        times: [String], // e.g., ["10:00 AM", "2:00 PM"]
      }
    ],

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Therapist =
  mongoose.models.Therapist || mongoose.model("Therapist", therapistSchema);
export default Therapist;
