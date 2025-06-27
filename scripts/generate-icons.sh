#!/bin/bash

# Exit on error
set -e

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is required. Please install it first:"
    echo "  On macOS: brew install imagemagick"
    echo "  On Linux: sudo apt-get install imagemagick"
    exit 1
fi

# Create iconset directory
mkdir -p build/icon.iconset

# Generate different sizes from SVG
convert -background none build/icon.svg -resize 16x16 build/icon.iconset/icon_16x16.png
convert -background none build/icon.svg -resize 32x32 build/icon.iconset/icon_16x16@2x.png
convert -background none build/icon.svg -resize 32x32 build/icon.iconset/icon_32x32.png
convert -background none build/icon.svg -resize 64x64 build/icon.iconset/icon_32x32@2x.png
convert -background none build/icon.svg -resize 128x128 build/icon.iconset/icon_128x128.png
convert -background none build/icon.svg -resize 256x256 build/icon.iconset/icon_128x128@2x.png
convert -background none build/icon.svg -resize 256x256 build/icon.iconset/icon_256x256.png
convert -background none build/icon.svg -resize 512x512 build/icon.iconset/icon_256x256@2x.png
convert -background none build/icon.svg -resize 512x512 build/icon.iconset/icon_512x512.png
convert -background none build/icon.svg -resize 1024x1024 build/icon.iconset/icon_512x512@2x.png

# Convert to icns
if [[ "$OSTYPE" == "darwin"* ]]; then
    iconutil -c icns build/icon.iconset -o build/icon.icns
else
    echo "Note: ICNS file can only be generated on macOS"
fi 