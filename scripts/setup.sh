#!/bin/bash

# Exit on error
set -e

echo "Setting up Real Screen Reader..."

# Check if conda is installed
if ! command -v conda &> /dev/null; then
    echo "Conda is not installed. Please install Miniconda or Anaconda first."
    echo "Visit: https://docs.conda.io/en/latest/miniconda.html"
    exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Create or update conda environment
echo "Setting up conda environment..."
CONDA_ENV_NAME="screen-reader"

# Remove existing environment if it exists
conda env remove -n $CONDA_ENV_NAME --yes 2>/dev/null || true

# Create new environment
conda create -n $CONDA_ENV_NAME python=3.10 nodejs=20 npm -y

# Activate environment and install dependencies
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate $CONDA_ENV_NAME

# Install npm dependencies
echo "Installing npm dependencies..."
cd "$PROJECT_ROOT"
npm install

# Create necessary directories
mkdir -p /tmp/real-screen-reader-test

# Install additional conda dependencies if needed
conda install -c conda-forge ffmpeg -y

echo "Setup complete! You can now run the application with:"
echo "1. Start the audio server:"
echo "   conda activate screen-reader && npm run test-audio"
echo ""
echo "2. In another terminal, start the main application:"
echo "   ./scripts/start.sh" 