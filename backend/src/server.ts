import app from './app.js';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';

dotenv.config();

const PORT = process.env.BACKEND_PORT || 5000;

connectDatabase().catch((err) => {
  console.log('[Database] Database running in resilient mode:', err.message);
});

app.listen(PORT, () => {
  console.log(`Smart Campus Backend Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`Database Telemetry: http://localhost:${PORT}/api/v1/database/status`);
});

