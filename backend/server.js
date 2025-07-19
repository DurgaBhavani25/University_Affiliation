const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const path=require('path')
const app = express();

app.use(cors({
  origin: "http://localhost:5500", // or your frontend URL
  credentials: true
}));

app.use(express.json());


const authRoutes = require('./routes/auth');
const affiliationRoutes = require('./routes/affiliation');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const profileRoutes = require('./routes/profile'); // update path as needed
app.use('/api', profileRoutes);
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);
const adminRoutes = require('./routes/admin'); // adjust path as needed

app.use('/admin', adminRoutes);
const appraisalRoutes = require('./routes/appraisal');

// Use it with a base path (e.g., /appraisal)
app.use('/appraisal', appraisalRoutes);

// Route usage
app.use('/api/auth', authRoutes);
app.use('/api/affiliations', affiliationRoutes);
connectDB().then(() => {
  app.listen(process.env.PORT || 5000, () => {
    console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
  });
});
