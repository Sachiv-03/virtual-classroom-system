const express = require('express');
const dotenv = require('dotenv');

// Load env vars immediately
dotenv.config();

const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Connect to database
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

connectDB();

const app = express();

// Body parser
app.use(express.json());
app.use(cookieParser());

// Static folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Enable CORS
app.use(cors({
    origin: true, // Allow any origin
    credentials: true, // Allow cookies
    exposedHeaders: ['Content-Disposition']
}));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Mount routers
const courseRoutes = require('./routes/courseRoutes');
const syllabusRoutes = require('./routes/syllabusRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/syllabus', syllabusRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
