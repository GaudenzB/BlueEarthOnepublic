#!/bin/bash

# BlueEarthOne Health Check Script
# This script checks the health of different components of the application
# and reports their status.

# Set default URL
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_BASE="${BASE_URL}/api"
CHECK_LEVEL="${1:-basic}" # basic, detailed, deep
TIMEOUT=5

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to make API call and return response
function callApi() {
  local endpoint=$1
  local timeout=${2:-$TIMEOUT}
  
  response=$(curl -s -m "$timeout" "${API_BASE}/${endpoint}" 2>&1)
  exit_code=$?
  
  if [ $exit_code -ne 0 ]; then
    echo "ERROR: Failed to connect to ${endpoint} (exit code: $exit_code)"
    return 1
  fi
  
  echo "$response"
  return 0
}

# Function to check basic health
function checkBasicHealth() {
  echo -e "${YELLOW}Checking basic health...${NC}"
  
  # Check if the server is running
  response=$(callApi "health")
  if [ $? -ne 0 ]; then
    echo -e "${RED}✘ Basic health check failed: Server not responding${NC}"
    exit 1
  fi
  
  # Parse response
  status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d':' -f2 | tr -d '"')
  
  if [ "$status" == "pass" ]; then
    echo -e "${GREEN}✓ Basic health check passed${NC}"
    return 0
  else
    echo -e "${RED}✘ Basic health check failed: Status is $status${NC}"
    return 1
  fi
}

# Function to check detailed health
function checkDetailedHealth() {
  echo -e "${YELLOW}Checking detailed health...${NC}"
  
  # Check detailed health endpoint
  response=$(callApi "health/detailed")
  if [ $? -ne 0 ]; then
    echo -e "${RED}✘ Detailed health check failed: Cannot connect to endpoint${NC}"
    return 1
  fi
  
  # Parse response
  status=$(echo "$response" | grep -o '"status":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')
  
  # Check database status
  db_status=$(echo "$response" | grep -o '"database":{"status":"[^"]*"' | cut -d':' -f3 | tr -d '"')
  if [ "$db_status" == "pass" ]; then
    echo -e "${GREEN}✓ Database health check passed${NC}"
  else
    echo -e "${RED}✘ Database health check failed${NC}"
  fi
  
  # Check filesystem status
  fs_status=$(echo "$response" | grep -o '"filesystem":{"status":"[^"]*"' | cut -d':' -f3 | tr -d '"')
  if [ "$fs_status" == "pass" ]; then
    echo -e "${GREEN}✓ Filesystem health check passed${NC}"
  else
    echo -e "${RED}✘ Filesystem health check failed${NC}"
  fi
  
  if [ "$status" == "pass" ]; then
    echo -e "${GREEN}✓ Detailed health check passed${NC}"
    return 0
  else
    echo -e "${RED}✘ Detailed health check failed: Status is $status${NC}"
    return 1
  fi
}

# Function to check deep health
function checkDeepHealth() {
  echo -e "${YELLOW}Performing deep health check...${NC}"
  
  # Check database health
  echo -e "${YELLOW}Checking database...${NC}"
  response=$(callApi "health/database")
  if [ $? -ne 0 ]; then
    echo -e "${RED}✘ Database health check failed: Cannot connect to endpoint${NC}"
  else
    db_status=$(echo "$response" | grep -o '"status":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')
    if [ "$db_status" == "pass" ]; then
      echo -e "${GREEN}✓ Database health check passed${NC}"
    else
      echo -e "${RED}✘ Database health check failed${NC}"
    fi
  fi
  
  # Check storage health
  echo -e "${YELLOW}Checking storage...${NC}"
  response=$(callApi "health/storage")
  if [ $? -ne 0 ]; then
    echo -e "${RED}✘ Storage health check failed: Cannot connect to endpoint${NC}"
  else
    storage_status=$(echo "$response" | grep -o '"status":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')
    storage_provider=$(echo "$response" | grep -o '"provider":"[^"]*"' | cut -d':' -f2 | tr -d '"')
    
    if [ "$storage_status" == "pass" ]; then
      echo -e "${GREEN}✓ Storage health check passed (Provider: $storage_provider)${NC}"
    else
      echo -e "${RED}✘ Storage health check failed${NC}"
    fi
  fi
  
  # Check SSO health (if configured)
  echo -e "${YELLOW}Checking SSO integration...${NC}"
  response=$(callApi "health/sso")
  if [ $? -ne 0 ]; then
    echo -e "${RED}✘ SSO health check failed: Cannot connect to endpoint${NC}"
  else
    sso_status=$(echo "$response" | grep -o '"status":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')
    
    if [ "$sso_status" == "pass" ]; then
      echo -e "${GREEN}✓ SSO health check passed${NC}"
    elif [ "$sso_status" == "warn" ]; then
      echo -e "${YELLOW}⚠ SSO integration not configured or only partially tested${NC}"
    else
      echo -e "${RED}✘ SSO health check failed${NC}"
    fi
  fi
  
  echo -e "${GREEN}✓ Deep health check completed${NC}"
  return 0
}

# Main function
function main() {
  echo -e "${YELLOW}BlueEarthOne Health Check${NC}"
  echo "Target: $API_BASE"
  echo "Check level: $CHECK_LEVEL"
  echo "----------------------------------------"
  
  # Always run basic health check
  checkBasicHealth
  basic_status=$?
  
  # Run detailed checks if requested or if running deep checks
  if [ "$CHECK_LEVEL" == "detailed" ] || [ "$CHECK_LEVEL" == "deep" ]; then
    if [ $basic_status -eq 0 ]; then
      checkDetailedHealth
      detailed_status=$?
    else
      echo -e "${RED}Skipping detailed health check due to basic check failure${NC}"
      exit 1
    fi
  fi
  
  # Run deep checks if requested
  if [ "$CHECK_LEVEL" == "deep" ]; then
    if [ $detailed_status -eq 0 ]; then
      checkDeepHealth
    else
      echo -e "${RED}Skipping deep health check due to detailed check failure${NC}"
      exit 1
    fi
  fi
  
  echo "----------------------------------------"
  echo -e "${GREEN}Health check completed!${NC}"
}

main