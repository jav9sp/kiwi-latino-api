import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import postRoutes from './routes/post.routes';
import tripRoutes from './routes/trip.routes';
import messageRoutes from './routes/message.routes';
import userRoutes from './routes/user.routes';
import uploadRoutes from './routes/upload.routes';
import { errorHandler } from './middlewares/error.middleware';
import { notFound } from './middlewares/notFound.middleware';

const app = express();

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
