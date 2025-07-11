const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});

module.exports = mongoose.model('College', collegeSchema);
