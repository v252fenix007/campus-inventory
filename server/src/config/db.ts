import mongoose from 'mongoose';

let cachedConnection: typeof mongoose | null = null;
let connectionPromise: Promise<typeof mongoose> | null = null;

export const connectDB = async (): Promise<typeof mongoose> => {
  // If already connected, reuse existing mongoose connection
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // If connection is in progress, return the pending promise
  if (connectionPromise) {
    return connectionPromise;
  }

  const connStr = process.env.MONGODB_URI;
  if (!connStr) {
    const errorMsg = '[MongoDB] MONGODB_URI environment variable is missing. Please define it in your .env or Vercel environment variables.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  connectionPromise = (async () => {
    try {
      const conn = await mongoose.connect(connStr, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      cachedConnection = conn;
      console.log(`[MongoDB] Connected successfully to ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (error) {
      connectionPromise = null;
      console.error('[MongoDB] Connection error:', error);
      throw error;
    }
  })();

  return connectionPromise;
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected from database.');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Runtime error:', err);
});

