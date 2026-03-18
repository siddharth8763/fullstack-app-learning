// =============================================================
// User Service Entry Point
// =============================================================

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { usersRouter } from './routes/users';
import { errorHandler } from './middleware/errorHandler';
import { metricsMiddleware, metricsRouter } from './metrics';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('combined'));
app.use(metricsMiddleware);

// Health Check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'user-service', timestamp: new Date().toISOString() });
});

// Routes
app.use('/users', usersRouter);
app.use('/metrics', metricsRouter);

// 404
app.use('*', (_req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use(errorHandler);

app.listen(PORT, () => console.log(`👤 User Service running on port ${PORT}`));

export default app;
