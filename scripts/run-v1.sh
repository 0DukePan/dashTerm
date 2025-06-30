#!/bin/bash

# LESSON: Development workflow scripts
echo "🚀 Setting up TUI Dashboard Version 1..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "🎯 Starting dashboard..."
    echo "   Press 'q' to quit"
    echo "   Press 'r' to refresh"
    echo "   Press 'h' for help"
    echo ""

# Start the application
    npm start
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
