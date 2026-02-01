import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import http from 'http';
import authRoutes from './routes/auth';
import monitorRoutes from './routes/monitors';
import pushRoutes from './routes/push';
import adminRoutes from './routes/admin';
import logsCtrl from './controllers/logs';
import incidentsRoutes from './routes/incidents';
import scheduler from './jobs/scheduler';
import dailyStats from './jobs/dailyStats';
import { initWebSocketServer } from './services/websocket';
import notifications from './notifications/webpush';
import pushbullet from './notifications/pushbullet';
import path from 'path';
import expressStatic from 'express';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(cors());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // Increased from 60 to 300
  message: 'Too many requests, slow down',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/logs', // Skip rate limiting for logs
});

// Apply rate limiting only to API routes (static file requests and page reloads won't be counted)
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/monitors', monitorRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/admin', adminRoutes);
app.post('/api/logs', logsCtrl.createLog);
app.use('/api/incidents', incidentsRoutes);

// expose VAPID public key to client
app.get('/vapidPublicKey', (req, res) => {
  const pushEnabled = (process.env.PUSH_ENABLED || 'false').toLowerCase() === 'true';
  if (!pushEnabled) return res.json({ publicKey: null });
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

// Serve frontend static (single-port mode) if built
const webDist = path.join(__dirname, '..', '..', 'web', 'dist');
if (require('fs').existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(webDist, 'index.html'));
  });
}

const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || '0.0.0.0';

const httpServer = http.createServer(app);

httpServer.listen(port, host, async () => {
  console.log(`Server listening on ${host}:${port}`);
  notifications.init();
  pushbullet.init();
  scheduler.start();
  dailyStats.start();
  initWebSocketServer(httpServer);
});

export default app;
