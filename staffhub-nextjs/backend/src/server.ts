import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import organizationRoutes from './routes/organization.routes';
import outpassRoutes from './routes/outpass.routes';
import meetingRoutes from './routes/meeting.routes';
import staffRoutes from './routes/staff.routes';
import feedbackRoutes from './routes/feedback.routes';
import orgbuilderRoutes from './routes/orgbuilder.routes';
import securityRoutes from './routes/security.routes';
import mockRoutes from './routes/mock.routes';
import { errorHandler } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const configuredFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = new Set<string>([
  configuredFrontendUrl,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3004'
]);

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);
    if (allowedOrigins.has(origin) || (process.env.NODE_ENV !== 'production' && isLocalhost)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/outpass', outpassRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/orgbuilder', orgbuilderRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/mock', mockRoutes); // Demo/testing endpoints with mock data

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});

export default app;
