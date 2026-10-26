#!/usr/bin/env bash

# CampusFlow - One-Click Setup Script for Mac / Linux
set -e

echo "============================================================"
echo "🎓 CampusFlow – Smart Student OD & Leave Management System"
echo "============================================================"
echo "Starting automated environment setup..."

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed! Please install Node.js v18 or newer from https://nodejs.org"
    exit 1
fi
echo "✓ Found Node.js: $(node -v)"

# 2. Setup Environment Files
echo ""
echo "📁 Setting up environment variables..."
if [ ! -f "server/.env" ]; then
    cp server/.env.example server/.env
    echo "✓ Created server/.env from template"
else
    echo "✓ server/.env already exists"
fi

if [ ! -f "client/.env" ]; then
    cp client/.env.example client/.env
    echo "✓ Created client/.env from template"
else
    echo "✓ client/.env already exists"
fi

# 3. Create upload folder
mkdir -p server/uploads

# 4. Install Dependencies
echo ""
echo "📦 Installing root, server, and client packages..."
npm install
npm --prefix server install
npm --prefix client install
echo "✓ All packages installed successfully!"

# 5. Seed Database
echo ""
echo "🌱 Seeding demo database with sample records..."
if npm --prefix server run seed; then
    echo "✓ Database seeded successfully!"
else
    echo "⚠️ Database seeding could not connect to MongoDB."
    echo "  Ensure MongoDB is running locally (mongodb://127.0.0.1:27017) or"
    echo "  paste your MongoDB Atlas URI in server/.env under MONGODB_URI."
fi

echo ""
echo "============================================================"
echo "🎉 SETUP COMPLETE! HOW TO RUN CAMPUSFLOW:"
echo "============================================================"
echo "Run this single command in the project root to start both apps:"
echo ""
echo "   npm run dev"
echo ""
echo "Then open in your browser:"
echo "   👉 Web App:      http://localhost:5173"
echo "   👉 Backend API:  http://localhost:5050/api/v1"
echo "   👉 Swagger Docs: http://localhost:5050/api-docs"
echo ""
echo "DEMO LOGINS:"
echo "   Student:  student@campusflow.edu  / Student@123"
echo "   Faculty:  faculty@campusflow.edu  / Faculty@123"
echo "   HOD:      hod@campusflow.edu      / Hod@123"
echo "   Admin:    admin@campusflow.edu    / Admin@123"
echo "============================================================"
