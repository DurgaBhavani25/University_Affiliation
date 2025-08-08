// routes/admin.js or routes/user.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const AffiliationRequest = require("../models/AffiliationRequest");
// Get all affiliated colleges
router.get("/affiliated-colleges", async (req, res) => {
  try {
    const colleges = await User.find({ role: "college" }).select("-password");
    res.status(200).json({ success: true, data: colleges });
  } catch (error) {
    console.error("Error fetching affiliated colleges:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.get("/affiliated-colleges/:id", async (req, res) => {
  try {
    const college = await User.findById(req.params.id).select("-password");
    if (!college) {
      return res
        .status(404)
        .json({ success: false, message: "College not found" });
    }
    res.status(200).json({ success: true, data: college });
  } catch (error) {
    console.error("Error fetching college details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET all appraisal officers
router.get("/appraisals", async (req, res) => {
  try {
    const appraisals = await User.find({ role: "appraisal" });
    res.status(200).json({ success: true, data: appraisals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.get("/appraisals/:id", async (req, res) => {
  try {
    const appraisal = await User.findById(req.params.id).select("-password");
    if (!appraisal || appraisal.role !== "appraisal") {
      return res
        .status(404)
        .json({ success: false, message: "Appraisal officer not found" });
    }

    res.status(200).json({ success: true, data: appraisal });
  } catch (err) {
    console.error("Error fetching appraisal details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// Example DELETE route in Express (admin.js or similar)
router.delete("/appraisals/:id", async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted || deleted.role !== "appraisal") {
      return res
        .status(404)
        .json({ success: false, message: "Appraisal officer not found" });
    }

    // ✅ Send valid JSON response
    return res.status(200).json({
      success: true,
      message: "Appraisal officer deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting appraisal officer:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/decision/:id", async (req, res) => {
  const { id } = req.params;
const decision = req.body.decision || req.body.adminDecision;



  // Validate input
  if (!["approved", "rejected", "resubmit"].includes(decision)) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid decision. Must be 'approved', 'rejected', or 'resubmit'.",
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

    // Save admin's decision
    application.adminDecision = decision;
    application.finalDecisionDate = new Date();

    // Reset application status if resubmission is needed
    if (decision === "resubmit") {
      application.appraisalStatus = "not_verified";
      application.status = decision;
    } else {
      // Otherwise set status same as decision
      application.status = decision; // "approved" or "rejected"
    }

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
