import express from 'express';
import { config } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import numbersRoutes from './modules/numbers/numbers.routes';
import simulateRoutes from './modules/calls/calls.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import contactsRoutes from './modules/contacts/contacts.routes';
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
app.use('/api/calls', simulateRoutes); // calls.routes has both / and /call
app.use('/api/simulate', simulateRoutes); // Keep /simulate/call working for mobile app
app.use('/api/analytics', analyticsRoutes);
app.use('/api/contacts', contactsRoutes);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

import { errorHandler } from './middleware/errorHandler';
app.use(errorHandler);

export { app };
