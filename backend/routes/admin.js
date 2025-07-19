// routes/admin.js or routes/user.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AffiliationRequest = require("../models/AffiliationRequest");
// Get all affiliated colleges
router.get('/affiliated-colleges', async (req, res) => {
  try {
    const colleges = await User.find({ role: 'college' }).select('-password');
    res.status(200).json({ success: true, data: colleges });
  } catch (error) {
    console.error('Error fetching affiliated colleges:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
// GET all appraisal officers
router.get('/appraisals', async (req, res) => {
  try {
    const appraisals = await User.find({ role: 'appraisal' });
    res.status(200).json({ success: true, data: appraisals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
router.post("/decision/:id", async (req, res) => {
  const { id } = req.params;
  const { decision } = req.body; // 'approved', 'rejected', or 'resubmit'

  // Validate decision input
  if (!["approved", "rejected", "resubmit"].includes(decision)) {
    return res.status(400).json({
      success: false,
      message: "Invalid decision. Must be 'approved', 'rejected', or 'resubmit'.",
    });
  }

  try {
    const application = await AffiliationRequest.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    application.adminDecision = decision;
    application.status = decision; // optionally update main status
    application.finalDecisionDate = new Date();

    await application.save();

    return res.status(200).json({
      success: true,
      message: `Application ${decision} successfully.`,
    });
  } catch (err) {
    console.error("Error updating decision:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

module.exports = router;


