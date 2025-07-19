// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
   // optional
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'college', 'appraisal'], required: true },

  collegeDetails: {
    collegeName: String,
    address: String,
    contactPerson: String,
    contactNumber: String,
    
  },

  appraisalDetails: {
    fullName: String,
    designation: String,
    department: String,
    contactNumber: String,
    region: String,
    experience: Number,
  bio: String 
  }
});

module.exports = mongoose.model('User', userSchema);
