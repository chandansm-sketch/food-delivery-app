import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

dotenv.config();

// Connect to MongoDB
connectDB();

import authRoutes from './routes/auth.js';
import restaurantRoutes from './routes/restaurant.js';
import orderRoutes from './routes/order.js';

const app = express();
const server = http.createServer(app);

// Socket.io setup for Real-Time Tracking
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Attach socket to app for controllers to use
app.set('socketio', io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Socket.io connection logic
io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    // Join role-specific or order-specific rooms
    socket.on('join_order_room', (orderId) => {
        socket.join(`order_${orderId}`);
        console.log(`Socket ${socket.id} joined room order_${orderId}`);
    });

    // Location update from Delivery Boy
    socket.on('update_location', (data) => {
        const { orderId, location } = data;
        // Broadcast location to the specific order room
        io.to(`order_${orderId}`).emit('location_updated', location);
    });

    // Order status update
    socket.on('update_status', (data) => {
        const { orderId, status } = data;
        io.to(`order_${orderId}`).emit('status_updated', status);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
