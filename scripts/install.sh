#!/bin/bash

# LESSON: Understanding npm install process
echo "🚀 Setting up TUI Dashboard Tutorial..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
echo "📋 Node.js version: $NODE_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "📚 What was installed:"
    echo "   • blessed: Terminal UI framework"
    echo "   • chalk: Terminal colors and styling"
    echo "   • systeminformation: System metrics collection"
    echo ""
    echo "🎯 Next step: Run 'npm start' to begin!"
else
    echo "❌ Installation failed. Please check your internet connection."
    exit 1
fi