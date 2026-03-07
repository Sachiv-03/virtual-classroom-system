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
app.use('/api/groups', require('./routes/groupRoutes'));


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

    socket.on('register', async (userId) => {
        if (userId) {
            userSockets.set(userId.toString(), socket.id);
            io.emit('online_users', Array.from(userSockets.keys()));

            // Join rooms for all groups the user is in
            try {
                const Group = require('./models/Group');
                const userGroups = await Group.find({ members: userId });
                userGroups.forEach(group => {
                    socket.join(`group_${group._id}`);
                    console.log(`User ${userId} joined room group_${group._id}`);
                });
            } catch (err) {
                console.error("Error joining group rooms:", err);
            }
        }
    });



    socket.on('send_message', (data) => {
        if (data.groupId) {
            // Send to the entire group room
            io.to(`group_${data.groupId}`).emit('receive_message', data);
        } else if (data.receiverId) {
            const receiverSocketId = userSockets.get(data.receiverId.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('receive_message', data);
            }
        }
    });

    socket.on('message_delivered', async (data) => {
        try {
            const MessageModel = require('./models/Message');
            await MessageModel.findByIdAndUpdate(data.messageId, { status: 'delivered' });
            if (data.senderId) {
                const senderSocketId = userSockets.get(data.senderId.toString());
                if (senderSocketId) {
                    io.to(senderSocketId).emit('message_status_update', { messageId: data.messageId, status: 'delivered' });
                }
            }
        } catch (err) { }
    });

    socket.on('mark_seen', async (data) => {
        try {
            const MessageModel = require('./models/Message');
            await MessageModel.updateMany(
                { senderId: data.senderId, receiverId: data.receiverId, status: { $ne: 'seen' } },
                { status: 'seen' }
            );
            if (data.senderId) {
                const senderSocketId = userSockets.get(data.senderId.toString());
                if (senderSocketId) {
                    io.to(senderSocketId).emit('messages_seen_update', { viewerId: data.receiverId });
                }
            }
        } catch (err) { }
    });

    socket.on('delete_message_event', (data) => {
        // data: { messageId, receiverId, groupId }
        if (data.groupId) {
            io.to(`group_${data.groupId}`).emit('message_deleted_sync', { messageId: data.messageId });
        } else if (data.receiverId) {
            const receiverSocketId = userSockets.get(data.receiverId.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('message_deleted_sync', { messageId: data.messageId });
            }
        }
    });

    socket.on('edit_message_event', (data) => {
        // data: { messageId, receiverId, groupId, messageText }
        if (data.groupId) {
            io.to(`group_${data.groupId}`).emit('message_edited_sync', data);
        } else if (data.receiverId) {
            const receiverSocketId = userSockets.get(data.receiverId.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('message_edited_sync', data);
            }
        }
    });

    socket.on('message_reaction_event', (data) => {
        // data: { messageId, receiverId, groupId, reactions }
        if (data.groupId) {
            io.to(`group_${data.groupId}`).emit('message_reaction_sync', data);
        } else if (data.receiverId) {
            const receiverSocketId = userSockets.get(data.receiverId.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('message_reaction_sync', data);
            }
        }
    });

    socket.on('join_group', (groupId) => {
        socket.join(`group_${groupId}`);
        console.log(`Socket ${socket.id} manually joined group_${groupId}`);
    });

    socket.on('leave_group', (groupId) => {
        socket.leave(`group_${groupId}`);
        console.log(`Socket ${socket.id} left group_${groupId}`);
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

