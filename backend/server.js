import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Config
import connectDB, { connectListingsDB } from './config/db.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';     // FR17, FR44
import supportRoutes from './routes/supportRoutes.js';     // FR45
import contractRoutes from './routes/contractRoutes.js';   // FR43

// Middleware imports
import errorHandler from './middlewares/errorHandler.js';

// Cron jobs (FR36, FR47)
import { startCronJobs } from './services/cronService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ─── Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);    // FR17, FR44
app.use('/api/support', supportRoutes);     // FR45
app.use('/api/contracts', contractRoutes);  // FR43

// ─── Health Check ───────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error Handler ──────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────
const PORT = process.env.PORT || 5001;

const startApp = async () => {
  await connectDB();
  await connectListingsDB();

  if (!process.env.VERCEL) {
    // FR36, FR47 — Start cron jobs after DB is ready
    startCronJobs();

    app.listen(PORT, () => {
      console.log(`🚀 DorMsa API running on port ${PORT}`);
    });
  }
};

startApp().catch(err => {
  console.error('Failed to start application:', err);
});

export default app;

