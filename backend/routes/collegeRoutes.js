const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const College = require('../models/College');

// Register Route
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await College.findOne({ email });
    if (existing) return res.status(400).json({ message: 'College already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const college = new College({ name, email, password: hashedPassword });
    await college.save();

    res.status(201).json({ message: 'College registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error registering college', error: err.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const college = await College.findOne({ email });
    if (!college) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, college.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: college._id, email: college.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, college: { id: college._id, name: college.name, email: college.email } });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
});

module.exports = router;
