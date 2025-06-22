#!/bin/bash

# Ensure script fails on any error
set -e

# Allow local X server connections
xhost +local:

# Build and start the container
docker-compose up --build 