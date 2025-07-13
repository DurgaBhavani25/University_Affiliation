const express = require('express');
const router = express.Router();
const AffiliationRequest = require('../models/AffiliationRequest');
const verifyToken = require('../middleware/verifyToken');
const upload = require('../middleware/upload');

// Optional: Centralized role constants
const ROLES = {
  ADMIN: 'admin',
  COLLEGE: 'college',
  APPRAISAL: 'appraisal',
};

// Optional: Role-based access middleware
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
}


router.post(
  '/',
  verifyToken,
  (req, res, next) => {
    upload.array('supportingDocuments', 5)(req, res, function (err) {
      if (err) {
        return res.status(400).json({ message: 'File upload error', error: err.message });
      }
      next();
    });
  },
  authorizeRoles(ROLES.COLLEGE),
  async (req, res) => {
    try {
      // ✅ Parse facultyInfo if sent as string
      if (req.body.facultyInfo && typeof req.body.facultyInfo === 'string') {
        try {
          req.body.facultyInfo = JSON.parse(req.body.facultyInfo);
        } catch (e) {
          return res.status(400).json({ message: 'Invalid facultyInfo JSON' });
        }
      }

      const docs = req.files.map(file => ({
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
      }));

      const request = new AffiliationRequest({
        ...req.body,
        submittedBy: req.user.id,
        supportingDocuments: docs,
      });

      await request.save();
      res.status(201).json({ message: 'Application submitted', request });
    } catch (err) {
      console.error("❌ Error during affiliation submission:", err);
      res.status(500).json({ message: 'Submission failed', error: err.message });
    }
  }
);

// Admin assigns appraisal
router.put(
  '/assign/:id',
  verifyToken,
  authorizeRoles(ROLES.ADMIN),
  async (req, res) => {
    try {
      const updatedRequest = await AffiliationRequest.findByIdAndUpdate(
        req.params.id,
        { assignedTo: req.body.assignedTo, status: 'assigned' },
        { new: true }
      );

      res.json({ message: 'Appraisal assigned', updatedRequest });
    } catch (err) {
      res.status(500).json({ message: 'Assignment failed', error: err.message });
    }
  }
);

// Appraisal submits remarks
router.put(
  '/verify/:id',
  verifyToken,
  authorizeRoles(ROLES.APPRAISAL),
  async (req, res) => {
    try {
      const updatedRequest = await AffiliationRequest.findByIdAndUpdate(
        req.params.id,
        {
          appraisalRemarks: req.body.remarks,
          appraisalStatus: req.body.status,
          status: 'under_review',
        },
        { new: true }
      );

      res.json({ message: 'Verified by appraisal', updatedRequest });
    } catch (err) {
      res.status(500).json({ message: 'Verification failed', error: err.message });
    }
  }
);

// Admin gives final decision
router.put(
  '/finalize/:id',
  verifyToken,
  authorizeRoles(ROLES.ADMIN),
  async (req, res) => {
    try {
      const updatedRequest = await AffiliationRequest.findByIdAndUpdate(
        req.params.id,
        {
          adminRemarks: req.body.adminRemarks,
          status: req.body.finalStatus, // 'approved' or 'rejected'
          finalDecisionDate: new Date(),
        },
        { new: true }
      );

      res.json({ message: 'Final decision recorded', updatedRequest });
    } catch (err) {
      res.status(500).json({ message: 'Finalization failed', error: err.message });
    }
  }
);

// College views their own requests
router.get('/my-requests', verifyToken, authorizeRoles(ROLES.COLLEGE), async (req, res) => {
  try {
    const requests = await AffiliationRequest.find({ submittedBy: req.user.id })
      .populate('assignedTo', 'email role') // Add more fields as needed
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching requests', error: err.message });
  }
});

// View application details
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const app = await AffiliationRequest.findById(req.params.id);

    if (!app) return res.status(404).json({ message: 'Application not found' });

    // Allow only the college that submitted the application to view it
    if (app.submittedBy.toString() !== req.user.id && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json(app);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete application (only if pending and by submitting college)
router.delete('/:id', verifyToken, authorizeRoles(ROLES.COLLEGE), async (req, res) => {
  try {
    const app = await AffiliationRequest.findById(req.params.id);

    if (!app) return res.status(404).json({ message: 'Application not found' });

    if (app.status !== 'pending') {
      return res.status(403).json({ message: 'Only pending applications can be deleted' });
    }

    if (app.submittedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    await app.deleteOne();
    res.json({ message: 'Application deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
