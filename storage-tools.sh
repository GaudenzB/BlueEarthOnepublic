#!/bin/bash
# Storage Tools Script
# This script provides commands for checking and testing the document storage system

# Define colors for better output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Show usage information
function show_usage {
  echo -e "${BLUE}Document Storage Tools${NC}"
  echo -e "Usage: ./storage-tools.sh [command]"
  echo -e ""
  echo -e "Commands:"
  echo -e "  ${GREEN}check${NC}      Check storage configuration"
  echo -e "  ${GREEN}upload${NC}     Test uploading a file to storage"
  echo -e "  ${GREEN}download${NC}   Test downloading a file from storage"
  echo -e "  ${GREEN}help${NC}       Show this help message"
  echo -e ""
}

# Check storage configuration
function check_storage {
  echo -e "${BLUE}Checking storage configuration...${NC}"
  npx tsx check-storage-config.ts
}

# Test uploading a file
function test_upload {
  echo -e "${BLUE}Testing file upload to storage...${NC}"
  npx tsx test-s3.ts
}

# Test downloading a file
function test_download {
  echo -e "${BLUE}Testing file download from storage...${NC}"
  npx tsx test-s3-download.ts
}

# Main script logic
case "$1" in
  "check")
    check_storage
    ;;
  "upload")
    test_upload
    ;;
  "download")
    test_download
    ;;
  "help" | "")
    show_usage
    ;;
  *)
    echo -e "${RED}Error: Unknown command '$1'${NC}"
    show_usage
    exit 1
    ;;
esac

exit 0