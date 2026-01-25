import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
import apiKeysRouter from './routes/apiKeys.js';
import { getDatabase, closeDatabase } from './store/db.js';
import pkg from '../package.json' assert { type: 'json' };

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const WS_PORT = parseInt(process.env.WS_PORT || '3002', 10);

// Initialize database on startup
try {
  getDatabase();
  console.log('[Web Server] Database initialized');
} catch (error) {
  console.error('[Web Server] Failed to initialize database:', error);
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: 'browser' });
});

// App info endpoints
app.get('/api/app/version', (req, res) => {
  res.json({ version: pkg.version });
});

app.get('/api/app/platform', (req, res) => {
  res.json({ platform: process.platform });
});

// API routes
app.use('/api/api-keys', apiKeysRouter);

// Start HTTP server
const httpServer = createServer(app);
httpServer.listen(PORT, () => {
  console.log(`[Web Server] HTTP server running on port ${PORT}`);
});

// Start WebSocket server for real-time task updates
const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected');
  
  ws.on('message', (message) => {
    console.log('[WebSocket] Received:', message.toString());
  });
  
  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected');
  });
});

console.log(`[Web Server] WebSocket server running on port ${WS_PORT}`);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Web Server] Shutting down...');
  httpServer.close(() => {
    wss.close(() => {
      closeDatabase();
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('[Web Server] Shutting down...');
  httpServer.close(() => {
    wss.close(() => {
      closeDatabase();
      process.exit(0);
    });
  });
});
