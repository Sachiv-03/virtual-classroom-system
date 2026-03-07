const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security Headers
app.use(helmet());

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Body parser
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(cookieParser());

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Compression
app.use(compression());

// Static folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Enable CORS
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : true,
    credentials: true,
    exposedHeaders: ['Content-Disposition']
};
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: 'Too many requests from this IP, please try again after 10 minutes'
});
app.use('/api', limiter);

// Mount routers
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/syllabus', require('./routes/syllabusRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/google-auth', require('./routes/googleAuthRoutes'));
app.use('/api/focus', require('./routes/focusRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));


// Serve static upload folders for messages, syllabus, etc
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Setup Socket.IO
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const ClassroomMessage = require('./models/ClassroomMessage');

const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : true,
        credentials: true
    }
});

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        // Fallback for requests that don't need auth immediately or didn't supply it
        // We can just proceed but leave socket.user undefined
        return next();
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        return next(new Error('Authentication error'));
    }
});

// Store active users: userId -> socketId
const userSockets = new Map();

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('register', (userId) => {
        if (userId) {
            userSockets.set(userId.toString(), socket.id);
            io.emit('online_users', Array.from(userSockets.keys()));
        }
    });



    socket.on('send_message', (data) => {
        // Here data should contain { receiverId, messageText, senderId, ... }
        if (data.receiverId) {
            const receiverSocketId = userSockets.get(data.receiverId.toString());
            if (receiverSocketId) {
                // Emit to the specific user via their socket ID
                io.to(receiverSocketId).emit('receive_message', data);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        for (let [userId, sId] of userSockets.entries()) {
            if (sId === socket.id) {
                userSockets.delete(userId);
                io.emit('online_users', Array.from(userSockets.keys()));
                break;
            }
        }
    });

    // CLASSROOM GROUP CHAT EVENTS

    socket.on('join_room', async ({ roomId }) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);

        try {
            // Send last 50 messages from history
            const messages = await ClassroomMessage.find({ roomId })
                .sort({ createdAt: -1 })
                .limit(50);

            // Re-sort to chronological for client
            socket.emit('message_history', messages.reverse());
        } catch (error) {
            console.error('Error fetching room history:', error);
        }
    });

    socket.on('send_classroom_message', async ({ roomId, sender, text }) => {
        // Verify JWT user ID matches sender ID for security if socket.user exists
        if (socket.user && socket.user.id !== sender.id) {
            console.log('Unauthorized sender:', sender.id);
            return;
        }

        try {
            // "check role === 'teacher' for announcements"
            const isAnnouncement = sender.role === 'teacher' && text.startsWith('/announce ');
            const actualText = isAnnouncement ? text.replace('/announce ', '') : text;

            const newMessage = await ClassroomMessage.create({
                roomId,
                sender: {
                    id: sender.id,
                    name: sender.name,
                    role: sender.role
                },
                text: actualText,
                isAnnouncement
            });

            io.to(roomId).emit('receive_classroom_message', newMessage);
        } catch (error) {
            console.error('Error saving classroom msg:', error);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

