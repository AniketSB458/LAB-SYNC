import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { dfdRouter } from './modules/dfd/routes.js';
import { inventoryRouter } from './modules/inventory/routes.js';
import { authRouter } from './modules/auth/routes.js';
import { labRouter } from './modules/labs/routes.js';
import { databaseRouter } from './modules/database/routes.js';

dotenv.config();

const app: Express = express();

// Security and middleware setup
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req: Request, _res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Smart Campus Lab & Resource Optimizer API is healthy',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

// DFD Constraints & Architecture Pipeline
app.use('/api/v1/dfd', dfdRouter);

// Real-Time Computer Batches & Normalized Equipment Models
app.use('/api/v1/inventory', inventoryRouter);

// Authentication & Institutional Access Details
app.use('/api/v1/auth', authRouter);

// Real-Time Daily Timing Slots & Laboratory Schedules
app.use('/api/v1/labs', labRouter);

// Supabase / PostgreSQL Database Telemetry & Schema Status
app.use('/api/v1/database', databaseRouter);
app.use('/api/v1/mongodb', databaseRouter);

export default app;
