import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  await connectDB();
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 CampusFlow Server running on port ${PORT}`);
    console.log(`📡 Health Check:  http://localhost:${PORT}/api/v1/health`);
    console.log(`📚 API Docs:      http://localhost:${PORT}/api-docs`);
    console.log(`🌐 Base API:      http://localhost:${PORT}/api/v1`);
    console.log(`====================================================`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
