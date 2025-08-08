const mongoose = require("mongoose");

const affiliationRequestSchema = new mongoose.Schema({
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  courseTitle: { type: String, required: true },
  duration: { type: String, required: true },
  intakeCapacity: { type: Number, required: true },
  facultyInfo: {
    name: String,
    qualification: String,
  },
  infrastructureDetails: { type: String, required: true },
  courseFee: { type: Number, required: true },
  affiliationType: {
    type: String,
    enum: ["New", "Renewal"],
    required: true,
  },
  supportingDocuments: [
    {
      fileName: String,
      fileUrl: String,
    },
  ],
  status: {
  type: String,
  enum: ["pending", "assigned", "approved", "rejected", "resubmit","resubmitted"], // ✅ changed 'resubmit' to 'resubmitted'
  default: "pending",
},
dueDate: {
  type: Date,
  default: null,
},


  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    // appraisal officer
  },
  appraisalRemarks: { type: String },
  appraisalStatus: {
    type: String,
    enum: ["not_verified", "verified", "rejected_by_appraisal"],
    default: "not_verified",
  },

  visitDate: Date,
  recommendation: String,
  verificationNotes: String,
  priority: String,
  appraisalDocuments: [
    {
      fileName: String,
      fileUrl: String,
    },
  ],
   adminDecision: {
  type: String,
  enum: ["approved", "rejected", "resubmit", "pending"], // ✅ added 'pending'
  default: null,
},


  finalDecisionDate: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AffiliationRequest", affiliationRequestSchema);
