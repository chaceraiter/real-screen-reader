#!/bin/bash

echo "Starting Real Screen Reader..."

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Activate conda environment
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate screen-reader

# Set development environment
export NODE_ENV=development

# Start the application
cd "$PROJECT_ROOT"
npm run dev 