#!/bin/bash

# Ensure we're in a conda environment
if [ -z "$CONDA_DEFAULT_ENV" ]; then
    echo "Please activate the conda environment first with:"
    echo "conda activate screen-reader-env"
    exit 1
fi

# Install dependencies
npm install

# Fix Electron sandbox permissions
sudo chown root:root node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 node_modules/electron/dist/chrome-sandbox

echo "Setup complete! You can now run 'npm run dev' to start the application." 