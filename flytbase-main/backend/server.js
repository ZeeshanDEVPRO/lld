import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';

import connectDB from './database/connection.js';
import authRoutes from './routes/auth.js';
import missionRoutes from './routes/missions.js';
import fleetRoutes from './routes/fleet.js';
import reportRoutes from './routes/reports.js';
import { SimulationEngine } from './services/simulationEngine.js';

dotenv.config();

// Connect to MongoDB
connectDB()
  .then(() => {
    console.log('✅ MongoDB connection established');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('\n💡 To fix this:');
    console.error('   1. Go to MongoDB Atlas → Network Access');
    console.error('   2. Click "Add IP Address"');
    console.error('   3. Add your current IP or use 0.0.0.0/0 for all IPs (development only)');
    console.error('   4. Wait 1-2 minutes for changes to propagate');
    console.error('\n⚠️  Server will continue but database operations will fail until connection is established.\n');
  });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*', // Allow all origins for hosted frontend
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize simulation engine
const simulationEngine = new SimulationEngine(io);

// Middleware
app.use(cors());
app.use(compression()); // Compress all responses
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Join mission room for real-time updates
  socket.on('mission:subscribe', (missionId) => {
    socket.join(`mission:${missionId}`);
    console.log(`Socket ${socket.id} subscribed to mission ${missionId}`);
  });

  socket.on('mission:unsubscribe', (missionId) => {
    socket.leave(`mission:${missionId}`);
    console.log(`Socket ${socket.id} unsubscribed from mission ${missionId}`);
  });
});

// Make simulation engine available to routes
app.locals.simulationEngine = simulationEngine;

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };

