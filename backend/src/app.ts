import express from 'express';
import { config } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import numbersRoutes from './modules/numbers/numbers.routes';
import { generalLimiter } from './middleware/rateLimiter';
import { validateToken } from './middleware/auth';

const app = express();

app.use(express.json());

// Auth routes (has its own rate limiter inside)
app.use('/api/auth', authRoutes);

// Apply auth middleware to all other routes
app.use(validateToken);

// General rate limiter for all protected routes
app.use(generalLimiter);

// Module routes
app.use('/api/numbers', numbersRoutes);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export { app };
