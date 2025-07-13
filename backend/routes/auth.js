const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register
// Register
// Register
router.post('/register', async (req, res) => {
  const { name, email, password, role, collegeDetails, appraisalDetails } = req.body;

  if (!['admin', 'college', 'appraisal'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'User already exists' });

  const hashed = await bcrypt.hash(password, 10);

  // Prepare user data
  const userData = {
    name,
    email,
    password: hashed,
    role,
  };

  // Include collegeDetails if role is college
  if (role === 'college' && collegeDetails) {
    userData.collegeDetails = collegeDetails;
  }

  // Include appraisalDetails if role is appraisal
  if (role === 'appraisal' && appraisalDetails) {
    userData.appraisalDetails = appraisalDetails;
  }

  const newUser = new User(userData);
  await newUser.save();

  res.status(201).json({ message: `${role} registered successfully` });
});


  router.post("/login", async (req, res) => {
  console.log("Login attempt body:", req.body);  // Add this
  const { email, password, role } = req.body;


  if (!email || !password || !role) {
    return res.status(400).json({ message: "Email, password, and role are required" });
  }

  try {
    const existingUser = await User.findOne({ email: email});

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if role matches
    if (existingUser.role !== role) {
      return res.status(403).json({ message: "Role mismatch. Unauthorized access." });
    }

    const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: existingUser._id, role: existingUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const { password: _,__v, ...userWithoutPassword } = existingUser.toObject();

    res.status(200).json({ token, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

module.exports = router;
