const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authenticate = require('../middleware/verifyToken');

router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id); // ✅ not _id

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      role: user.role,
      email: user.email,
      collegeName: user.collegeDetails?.collegeName || null,
      address: user.collegeDetails?.address || '',
      contactPerson: user.collegeDetails?.contactPerson || '',
      contactNumber:user.collegeDetails?.contactNumber || ''
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
router.put('/profile/update', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.collegeDetails = {
      collegeName: req.body.collegeName,
      address: req.body.address,
      contactPerson: req.body.contactPerson,
      contactNumber: req.body.contactNumber
    };

    await user.save();
    res.json({ message: 'College details updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});


module.exports = router;
