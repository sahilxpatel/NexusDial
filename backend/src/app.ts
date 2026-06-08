import express from 'express';
import { config } from './config/env';

const app = express();

app.use(express.json());

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export { app };
