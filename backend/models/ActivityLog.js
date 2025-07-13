const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'AffiliationRequest' },
  actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, enum: ['admin', 'college', 'appraisal'] },
  action: { type: String },
  message: String,
  timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('ActivityLog', activityLogSchema);
