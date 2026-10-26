import dotenv from 'dotenv';
dotenv.config();

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';

let appInstance: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDB();
    if (!appInstance) {
      appInstance = createApp();
    }
    return appInstance(req, res);
  } catch (error: any) {
    console.error('[Vercel Serverless Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server failed to connect to database or process request',
      error: error.message || String(error),
    });
  }
}
