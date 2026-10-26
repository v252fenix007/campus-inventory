#!/usr/bin/env bash

# CampusFlow - Packaging Script
# Creates a clean, lightweight zip file for sharing with colleagues/friends.
set -e

ARCHIVE_NAME="campusflow-project.zip"

echo "============================================================"
echo "📦 Packaging CampusFlow for Sharing..."
echo "============================================================"

# Remove old archive if exists
rm -f "$ARCHIVE_NAME"

# Create clean zip excluding node_modules, build directories, and cache
echo "Creating $ARCHIVE_NAME (excluding bulky node_modules and cache)..."
zip -r "$ARCHIVE_NAME" . \
  -x "node_modules/*" \
  -x "*/node_modules/*" \
  -x "client/dist/*" \
  -x "server/dist/*" \
  -x ".git/*" \
  -x ".DS_Store" \
  -x "*/.DS_Store" \
  -x "server/uploads/*" \
  -x "*.log"

echo ""
echo "============================================================"
echo "✅ ARCHIVE CREATED SUCCESSFULLY!"
echo "============================================================"
echo "File: $ARCHIVE_NAME"
echo "Size: $(du -sh "$ARCHIVE_NAME" | cut -f1)"
echo ""
echo "You can now directly send $ARCHIVE_NAME to your friend via:"
echo "  • Google Drive / Dropbox"
echo "  • Email / WhatsApp / Telegram"
echo "  • USB Drive"
echo "============================================================"
