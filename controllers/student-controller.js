import Student from "../models/student-model.js";
import Therapist from "../models/Therapist-model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOTP, verifyOTP } from "../config/otp.js";
import redisClient from "../config/redisClient.js";
import nodemailer from "nodemailer";

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ---------------- Register Student ----------------
export const registerStudent = async (req, res) => {
  try {
    const { email, password, collegeName } = req.body;
    console.log("Register request received:", email, collegeName);

    const existing = await Student.findOne({ email });
    if (existing) {
      console.log("Student already exists:", email);
      return res.status(400).json({ message: "Student already exists" });
    }

    // Save plain password in Redis temporarily for OTP verification
    await redisClient.set(
      `pendingStudent:${email}`,
      JSON.stringify({ email, password, collegeName }),
      { EX: 600 } // expires in 10 minutes
    );
    console.log("Pending student saved to Redis");

    const otp = await sendOTP(email);
    console.log("OTP generated:", otp);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your Student Account",
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    });

    res.status(200).json({ message: "OTP sent. Verify to complete registration." });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ---------------- Verify Signup OTP ----------------
export const verifyStudentSignup = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log("Verify signup OTP request:", email, otp);

    const isValid = await verifyOTP(email, otp);
    console.log("Is OTP valid?", isValid);
    if (!isValid) return res.status(400).json({ message: "Invalid OTP" });

    const pendingData = await redisClient.get(`pendingStudent:${email}`);
    console.log("Pending student data from Redis:", pendingData);
    if (!pendingData) return res.status(400).json({ message: "No signup found" });

    const { password, collegeName } = JSON.parse(pendingData);
    console.log("Parsed pending data:", password, collegeName);

    // Save student to MongoDB (password will be hashed automatically in pre-save hook)
    const student = new Student({ email, password, collegeName });
    await student.save();
    console.log("Student saved to MongoDB:", student._id);

    // Cleanup Redis
    await redisClient.del(`otp:${email}`);
    await redisClient.del(`pendingStudent:${email}`);
    console.log("Redis keys cleaned");

    res.status(201).json({ message: "Student registered", student });
  } catch (error) {
    console.error("Verify signup error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ---------------- Login Student ----------------
export const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login request:", email, password);

    const student = await Student.findOne({ email });
    console.log("Student fetched from DB:", student);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const isMatch = await bcrypt.compare(password, student.password);
    console.log("Password match result:", isMatch);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const otp = await sendOTP(email);
    console.log("Login OTP generated:", otp);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Login OTP",
      text: `Your OTP is ${otp}.`,
    });

    res.status(200).json({ message: "OTP sent. Verify login." });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ---------------- Verify Login OTP ----------------
export const verifyStudentLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log("Verify login OTP request:", email, otp);

    const isValid = await verifyOTP(email, otp);
    console.log("Is OTP valid?", isValid);
    if (!isValid) return res.status(400).json({ message: "Invalid OTP" });

    const student = await Student.findOne({ email });
    console.log("Student fetched from DB:", student);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const token = jwt.sign(
      { id: student._id, role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    console.log("JWT generated:", token);

    await redisClient.del(`otp:${email}`);
    console.log("OTP key deleted from Redis");

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Verify login error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ---------------- Get All Therapists ----------------
export const getAllTherapistsPublic = async (req, res) => {
  try {
    const therapists = await Therapist.find({ status: "approved" }).select("-password -__v");
    res.status(200).json({ therapists });
  } catch (error) {
    console.error("Error fetching therapists:", error.message);
    res.status(500).json({ message: "Error fetching therapists", error: error.message });
  }
};
