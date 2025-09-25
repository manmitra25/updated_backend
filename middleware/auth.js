// middleware/auth.js
import jwt from 'jsonwebtoken';
import Volunteer from '../models/Volunteers-model.js';
import Student from '../models/student-model.js';
import Therapist from '../models/Therapist-model.js';

/**
 * Generic route protection middleware
 * Verifies JWT token and attaches user info to req.user
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    // Try fetching the user based on role
    let user = await Student.findById(decoded.id).select('-password');

    if (!user) user = await Volunteer.findById(decoded.id).select('-password');

    if (!user && decoded.role === 'therapist') {
      user = await Therapist.findById(decoded.id).select('-password');
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach info to req.user
    req.user = {
      id: user._id,
      role: decoded.role,
      ...(decoded.role === 'volunteer' && { volunteerId: user._id }),
      ...(decoded.role === 'therapist' && { therapistId: user._id }),
    };

    next();
  } catch (error) {
    console.error('Protect middleware error:', error.message);
    res.status(401).json({ message: 'Not authorized', error: error.message });
  }
};

/**
 * Volunteer-only protection middleware
 */
export const volunteerProtect = async (req, res, next) => {
  try {
    console.log('Inside volunteerProtect, req.user:', req.user);

    if (!req.user || !req.user.volunteerId) {
      return res.status(403).json({ message: 'Not authorized as a volunteer' });
    }

    const volunteer = await Volunteer.findById(req.user.volunteerId);
    if (!volunteer) {
      return res.status(403).json({ message: 'Not authorized as a volunteer' });
    }

    req.user.volunteerDoc = volunteer; // optional: full doc
    next();
  } catch (error) {
    console.error('VolunteerProtect error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Therapist-only protection middleware
 */
export const protectTherapist = async (req, res, next) => {
  try {
    console.log('Inside therapistProtect, req.user:', req.user);

    if (!req.user || !req.user.therapistId) {
      return res.status(403).json({ message: 'Not authorized as a therapist' });
    }

    const therapist = await Therapist.findById(req.user.therapistId);
    if (!therapist) {
      return res.status(403).json({ message: 'Not authorized as a therapist' });
    }

    req.user.therapistDoc = therapist; // optional: full doc
    next();
  } catch (error) {
    console.error('TherapistProtect error:', error.message);
    res.status(500).json({ message: error.message });
  }
};
