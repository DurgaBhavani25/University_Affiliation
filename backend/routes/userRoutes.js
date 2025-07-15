const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/users?role=appraisal
router.get('/', async (req, res) => {
  const role = req.query.role;
  if (!role) {
    return res.status(400).json({ error: 'Role query parameter is required' });
  }

  try {
    const users = await User.find({ role });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
