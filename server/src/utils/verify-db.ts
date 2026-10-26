import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { ODRequest } from '../models/ODRequest.js';
import { Department } from '../models/Department.js';

async function verifyDatabase() {
  console.log('\n====================================================');
  console.log('🔍 CAMPUSFLOW MONGODB VERIFICATION TOOL');
  console.log('====================================================');

  const rawUri = process.env.MONGODB_URI;
  if (!rawUri) {
    console.error('❌ ERROR: MONGODB_URI is not set in server/.env');
    console.error('Please configure your MongoDB Atlas or Compass connection string in server/.env');
    process.exit(1);
  }

  // Mask password for safe display
  const maskedUri = rawUri.replace(/:([^:@]+)@/, ':****@');
  console.log(`📌 Target URI: ${maskedUri}`);

  try {
    const startTime = Date.now();
    await connectDB();
    const duration = Date.now() - startTime;

    console.log(`✅ [MongoDB Connection]: SUCCESS (${duration}ms)`);
    console.log(`   Host:     ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Port:     ${mongoose.connection.port || 'Default / SRV'}`);

    // Ping check
    const pingResult = await mongoose.connection.db?.admin().ping();
    console.log(`✅ [Ping Status]: Active and responsive (${JSON.stringify(pingResult)})`);

    // Verify existing collections & seed data
    const userCount = await User.countDocuments();
    const deptCount = await Department.countDocuments();
    const odCount = await ODRequest.countDocuments();

    console.log('\n📊 Database Collection Summary:');
    console.log(`   - Users:        ${userCount}`);
    console.log(`   - Departments:  ${deptCount}`);
    console.log(`   - OD Requests:  ${odCount}`);

    if (userCount === 0) {
      console.log('\n⚠️  Database is currently empty. Run "npm run seed" to load default demo users & policies.');
    } else {
      console.log('\n🎉 Verification completed successfully! Database is initialized and ready for production.');
    }

    console.log('====================================================\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ MongoDB Connection Failed!');
    console.error(`Reason: ${err.message || err}`);
    console.error('\nTroubleshooting Checklist:');
    console.error('1. If using MongoDB Atlas: Have you allowed IP Access (0.0.0.0/0) in Atlas Network Access?');
    console.error('2. Did you replace <db_password> or special characters with URL encoded characters in the URI?');
    console.error('3. Does the database user have readWrite permissions on the cluster?');
    console.error('====================================================\n');
    process.exit(1);
  }
}

verifyDatabase();
