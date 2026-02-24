#!/bin/bash
# Script to download Noto Sans fonts for invoice PDF generation

FONT_DIR="assets/fonts"
mkdir -p "$FONT_DIR"

echo "Downloading Noto Sans fonts..."

# Download Noto Sans Regular
curl -L "https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-Regular.ttf" \
  -o "$FONT_DIR/NotoSans-Regular.ttf"

# Download Noto Sans Bold
curl -L "https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-Bold.ttf" \
  -o "$FONT_DIR/NotoSans-Bold.ttf"

echo "Fonts downloaded to $FONT_DIR/"
ls -lh "$FONT_DIR/"
