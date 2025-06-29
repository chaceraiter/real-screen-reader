#!/bin/bash

# Exit on error
set -e

echo "Starting Real Screen Reader..."

# Activate conda environment
source /opt/conda/etc/profile.d/conda.sh
if ! conda activate screen-reader; then
    echo "Error: Failed to activate conda environment"
    exit 1
fi

# Set development environment
export NODE_ENV=development

# Start the audio server in the background
echo "Starting audio test server..."
npm run test-audio &

# Wait a moment for the audio server to start
sleep 2

# Start the main application
echo "Starting main application..."
exec npm run dev 