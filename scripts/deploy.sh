#!/bin/bash

echo "🚀 Starting deployment to Firebase..."

# Build the Next.js app for static export
echo "📦 Building Next.js app..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Next.js build failed!"
    exit 1
fi

# Install Firebase Functions dependencies
echo "📦 Installing Firebase Functions dependencies..."
cd functions
npm install

# Build Firebase Functions
echo "🔨 Building Firebase Functions..."
npm run build

# Check if Functions build was successful
if [ $? -ne 0 ]; then
    echo "❌ Firebase Functions build failed!"
    exit 1
fi

# Go back to root directory
cd ..

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your app should be available at your Firebase Hosting URL"
else
    echo "❌ Deployment failed!"
    exit 1
fi 