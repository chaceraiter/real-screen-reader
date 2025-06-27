#!/bin/bash

# Exit on error
set -e

echo "Setting up Real Screen Reader dependencies..."

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install Python if not installed
if ! command -v python3 &> /dev/null; then
    echo "Installing Python..."
    brew install python@3.8
fi

# Install pip if not installed
if ! command -v pip3 &> /dev/null; then
    echo "Installing pip..."
    python3 -m ensurepip --upgrade
fi

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv ~/.venv/real-screen-reader

# Activate virtual environment
source ~/.venv/real-screen-reader/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install piper-tts

# Create application support directory
mkdir -p ~/Library/Application\ Support/Real\ Screen\ Reader/voices

# Copy voice models
echo "Installing voice models..."
cp ../resources/voices/*.onnx ~/Library/Application\ Support/Real\ Screen\ Reader/voices/

echo "Setup complete! You can now run Real Screen Reader." 