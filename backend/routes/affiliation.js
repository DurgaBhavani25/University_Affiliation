const express = require("express");
const router = express.Router();
const AffiliationRequest = require("../models/AffiliationRequest");
const User = require("../models/User");
const verifyToken = require("../middleware/verifyToken");
const upload = require("../middleware/upload");

// Optional: Centralized role constants
const ROLES = {
  ADMIN: "admin",
  COLLEGE: "college",
  APPRAISAL: "appraisal",
};

// Optional: Role-based access middleware
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}

router.post(
  "/",
  verifyToken,
  (req, res, next) => {
    upload.array("supportingDocuments", 5)(req, res, function (err) {
      if (err) {
        return res
          .status(400)
          .json({ message: "File upload error", error: err.message });
      }
      next();
    });
  },
  authorizeRoles(ROLES.COLLEGE),
  async (req, res) => {
    try {
      // ✅ Parse facultyInfo if sent as string
      if (req.body.facultyInfo && typeof req.body.facultyInfo === "string") {
        try {
          req.body.facultyInfo = JSON.parse(req.body.facultyInfo);
        } catch (e) {
          return res.status(400).json({ message: "Invalid facultyInfo JSON" });
        }
      }

      const docs = req.files.map((file) => ({
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
      }));

      const request = new AffiliationRequest({
        ...req.body,
        submittedBy: req.user.id,
        supportingDocuments: docs,
      });

      await request.save();
      res.status(201).json({ message: "Application submitted", request });
    } catch (err) {
      console.error("❌ Error during affiliation submission:", err);
      res
        .status(500)
        .json({ message: "Submission failed", error: err.message });
    }
  }
);
//to get all affiliation req for admin to see
router.get(
  "/all",
  verifyToken,
  authorizeRoles(ROLES.ADMIN),
  async (req, res) => {
    try {
      console.log("Admin Authenticated:", req.user);

      const { status, affiliationType, page = 1, limit = 40 } = req.query;
      const filter = {};
      if (status) filter.status = status;
      if (affiliationType) filter.affiliationType = affiliationType;

      console.log("Applying filter:", filter);

      const requests = await AffiliationRequest.find(filter)
        .populate("submittedBy")
        .populate("assignedTo", "email role")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const totalCount = await AffiliationRequest.countDocuments(filter);

      console.log("Fetched Requests:", requests.length);

      res.json({
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        requests,
      });
    } catch (err) {
      console.error("🔥 Error fetching affiliations:", err);
      res
        .status(500)
        .json({ message: "Error fetching requests", error: err.message });
    }
  }
);

//assign requests from particular college to one apprisal
router.put(
  '/assign-by-college',
  verifyToken,
  authorizeRoles(ROLES.ADMIN),
  async (req, res) => {
    try {
      const { collegeName, assignedTo } = req.body;

      if (!collegeName || !assignedTo) {
        return res.status(400).json({ message: "collegeName and assignedTo are required" });
      }

      // Fetch all requests with user details
      const requests = await AffiliationRequest.find().populate('submittedBy');

      // Filter requests where the user's college name matches
      const filteredRequests = requests.filter(
        req => req.submittedBy?.collegeDetails?.collegeName === collegeName
      );

      if (filteredRequests.length === 0) {
        return res.status(404).json({ message: "No requests found for this college" });
      }

      // Filter only unassigned requests
      const unassignedRequests = filteredRequests.filter(req => req.assignedTo == null && req.status !== 'assigned'
);

      if (unassignedRequests.length === 0) {
        return res.status(400).json({ message: "All requests are already assigned" });
      }

      // Assign appraisal officer to each unassigned request
      const updates = await Promise.all(
        unassignedRequests.map(async (req) => {
          req.assignedTo = assignedTo;
          req.status = 'assigned';
          return req.save();
        })
      );

      res.json({
        message: `${updates.length} requests assigned to appraisal officer`,
        assignedTo
      });
    } catch (err) {
      console.error("Bulk Assignment Error:", err);
      res.status(500).json({ message: "Error assigning requests", error: err.message });
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
      const { id } = req.params;
      const { assignedTo } = req.body;

      if (!assignedTo) {
        return res.status(400).json({ message: "AssignedTo field is required" });
      }

      const request = await AffiliationRequest.findById(id);
      if (!request) {
        return res.status(404).json({ message: "Affiliation request not found" });
      }
      if (request.status === 'assigned') {
  return res.status(400).json({ message: "Request already assigned" });
}


      request.assignedTo = assignedTo;
      request.status = 'assigned'; // ✅ Update status here
      await request.save();

      res.json({ message: "Appraisal officer assigned and status updated", request });
    } catch (err) {
      console.error("Assignment Error:", err);
      res.status(500).json({ message: "Error assigning officer", error: err.message });
    }
  }
);
// Appraisal submits remarks
router.put(
  "/verify/:id",
  verifyToken,
  authorizeRoles(ROLES.APPRAISAL),
  async (req, res) => {
    try {
      const updatedRequest = await AffiliationRequest.findByIdAndUpdate(
        req.params.id,
        {
          appraisalRemarks: req.body.remarks,
          appraisalStatus: req.body.status,
          status: "under_review",
        },
        { new: true }
      );

      res.json({ message: "Verified by appraisal", updatedRequest });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Verification failed", error: err.message });
    }
  }
);

// Admin gives final decision
router.put(
  "/finalize/:id",
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

      res.json({ message: "Final decision recorded", updatedRequest });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Finalization failed", error: err.message });
    }
  }
);

// College views their own requests
router.get(
  "/my-requests",
  verifyToken,
  authorizeRoles(ROLES.COLLEGE),
  async (req, res) => {
    try {
      const requests = await AffiliationRequest.find({
        submittedBy: req.user.id,
      })
        .populate("assignedTo", "email role") // Add more fields as needed
        .sort({ createdAt: -1 });

      res.json(requests);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error fetching requests", error: err.message });
    }
  }
);

// View application details
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const app = await AffiliationRequest.findById(req.params.id);

    if (!app) return res.status(404).json({ message: "Application not found" });

    // Allow only the college that submitted the application to view it
    if (
      app.submittedBy.toString() !== req.user.id &&
      req.user.role !== ROLES.ADMIN
    ) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.json(app);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete application (only if pending and by submitting college)
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles(ROLES.COLLEGE),
  async (req, res) => {
    try {
      const app = await AffiliationRequest.findById(req.params.id);

      if (!app)
        return res.status(404).json({ message: "Application not found" });

      if (app.status !== "pending") {
        return res
          .status(403)
          .json({ message: "Only pending applications can be deleted" });
      }

      if (app.submittedBy.toString() !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      await app.deleteOne();
      res.json({ message: "Application deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

module.exports = router;
