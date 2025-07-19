// routes/appraisal.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const upload = require('../middleware/upload');
const AffiliationRequest=require('../models/AffiliationRequest')

// Middleware to protect the route (dummy example)
const authenticate = require('../middleware/verifyToken');

// GET appraisal profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const user = await User.findById(userId).select('-password');

    if (!user || user.role !== 'appraisal') {
      return res.status(404).json({ success: false, message: 'Appraisal profile not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
// PUT update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
   const {
  fullName,
  department,
  region,
  contactNumber,
  password,
  bio,
  experience,
  designation
} = req.body;

    const updates = {
       'appraisalDetails.fullName': fullName,
  'appraisalDetails.department': department,
  'appraisalDetails.region': region,
  'appraisalDetails.contactNumber': contactNumber,
  'appraisalDetails.designation': designation, // ✅ Add this line
  'appraisalDetails.experience': experience,
  'appraisalDetails.bio': bio // ✅ Add this line
    };

    if (password) {
      // hash it before saving (you should use bcrypt)
      const bcrypt = require('bcryptjs');
      const hashed = await bcrypt.hash(password, 10);
      updates.password = hashed;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ success: true, data: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});
router.get('/assigned-applications', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Parse pagination query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const skip = (page - 1) * limit;

    // Query filter
    const filter = {
      assignedTo: userId,
      appraisalStatus: { $ne: 'verified' }
    };

    // Get total count
    const total = await AffiliationRequest.countDocuments(filter);

    // Fetch paginated results
    const applications = await AffiliationRequest.find(filter)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'submittedBy',
        select: 'collegeDetails email'
      });

    res.status(200).json({
      success: true,
      data: applications,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching assigned applications:', error);
    res.status(500).json({ success: false, message: 'Error fetching assigned applications' });
  }
});

router.get('/application/:id', authenticate, async (req, res) => {
  try {
    const applicationId = req.params.id;

    const application = await AffiliationRequest.findById(applicationId)
      .populate({
        path: 'submittedBy',
        select: 'email collegeDetails'
      });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.status(200).json({ success: true, data: application });
  } catch (error) {
    console.error('Error fetching application by ID:', error);
    res.status(500).json({ success: false, message: 'Error fetching application' });
  }
});
router.post('/submit-verification/:id', authenticate, upload.array('supportingDocs',5), async (req, res) => {
  try {
    const appId = req.params.id;
    const {
      visitDate,
      recommendation,
      verificationNotes,
      priority
    } = req.body;

    const files = req.files.map(file => ({
      fileName: file.originalname,
      fileUrl: `/uploads/${file.filename}`
    }));

    const updatedApp = await AffiliationRequest.findByIdAndUpdate(appId, {
      appraisalStatus: 'verified',
      visitDate,
      recommendation,
      verificationNotes,
      priority,
      appraisalDocuments: files
    }, { new: true });

    res.status(200).json({ success: true, message: 'Verification submitted successfully', data: updatedApp });
  } catch (err) {
    console.error('Error submitting verification:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
// routes/appraisal.js

router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const total = await AffiliationRequest.countDocuments({ assignedTo: userId });
    const pending = await AffiliationRequest.countDocuments({ assignedTo: userId, appraisalStatus: { $ne: 'verified' } });
    const approved = await AffiliationRequest.countDocuments({ assignedTo: userId, recommendation: 'approve' });
    const rejected = await AffiliationRequest.countDocuments({ assignedTo: userId, recommendation: 'reject' });

    res.json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected
      }
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
});

module.exports = router;
