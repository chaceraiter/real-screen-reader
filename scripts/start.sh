#!/bin/bash

# Ensure script fails on any error
set -e

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    source .env
fi

# Set default values for environment variables
CONDA_HOME=${CONDA_HOME:-"$HOME/miniconda"}
CONDA_ENV_NAME=${CONDA_ENV_NAME:-"screen-reader"}

# Initialize conda from the correct location
CONDA_PATH="$CONDA_HOME/etc/profile.d/conda.sh"
if [ -f "$CONDA_PATH" ]; then
    . "$CONDA_PATH"
else
    echo "Error: Could not find conda.sh at $CONDA_PATH"
    echo "Please set CONDA_HOME in .env file or environment"
    exit 1
fi

# Activate conda environment
if ! conda activate $CONDA_ENV_NAME; then
    echo "Error: Could not activate conda environment '$CONDA_ENV_NAME'"
    echo "The environment should be at: $CONDA_HOME/envs/$CONDA_ENV_NAME"
    echo "Please create it with: conda create -n $CONDA_ENV_NAME python=3.8"
    exit 1
fi

# Set required environment variables
export DISPLAY=${DISPLAY:-":0"}
export LIBGL_ALWAYS_SOFTWARE=${LIBGL_ALWAYS_SOFTWARE:-"1"}

# Start the application
echo "Starting Real Screen Reader..."
cd "$(dirname "$0")"  # Ensure we're in the script's directory
npm run dev 