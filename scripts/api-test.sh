#!/bin/bash

# BlueEarthOne API Testing Script
# This script performs automated API tests against the application

# Set default URL
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_BASE="${BASE_URL}/api"
TEST_MODE="${1:-basic}" # basic, detailed, end-to-end
OUTPUT_DIR="./test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="${OUTPUT_DIR}/api-test-${TEST_MODE}-${TIMESTAMP}.log"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test credentials
USERNAME="admin"
PASSWORD="password123"
AUTH_TOKEN=""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Function to make API call and return response
function callApi() {
  local endpoint=$1
  local method=${2:-"GET"}
  local data=${3:-""}
  local auth=${4:-""}
  
  local auth_header=""
  if [ -n "$auth" ]; then
    auth_header="-H 'Authorization: Bearer $auth'"
  fi
  
  local content_type=""
  if [ -n "$data" ]; then
    content_type="-H 'Content-Type: application/json'"
  fi
  
  local data_arg=""
  if [ -n "$data" ]; then
    data_arg="-d '$data'"
  fi
  
  local cmd="curl -s -X $method $auth_header $content_type $data_arg '${API_BASE}/${endpoint}'"
  
  # Log the command but hide the auth token
  local log_cmd="curl -s -X $method"
  if [ -n "$auth" ]; then
    log_cmd="$log_cmd -H 'Authorization: Bearer [REDACTED]'"
  fi
  if [ -n "$content_type" ]; then
    log_cmd="$log_cmd $content_type"
  fi
  if [ -n "$data" ]; then
    log_cmd="$log_cmd -d '$data'"
  fi
  log_cmd="$log_cmd '${API_BASE}/${endpoint}'"
  
  echo -e "${YELLOW}Request:${NC} $log_cmd" | tee -a "$OUTPUT_FILE"
  
  # Execute the API call
  local response=$(eval "$cmd")
  local status=$?
  
  echo -e "${YELLOW}Response:${NC} $response" | tee -a "$OUTPUT_FILE"
  echo "" | tee -a "$OUTPUT_FILE"
  
  if [ $status -ne 0 ]; then
    echo -e "${RED}Error executing API call (status: $status)${NC}" | tee -a "$OUTPUT_FILE"
    return 1
  fi
  
  echo "$response"
  return 0
}

# Function to authenticate
function authenticate() {
  echo -e "${YELLOW}Authenticating as $USERNAME...${NC}" | tee -a "$OUTPUT_FILE"
  
  local payload="{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}"
  local response=$(callApi "auth/login" "POST" "$payload")
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Authentication failed${NC}" | tee -a "$OUTPUT_FILE"
    return 1
  fi
  
  # Extract token from response
  AUTH_TOKEN=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d':' -f2 | tr -d '"')
  
  if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${RED}Failed to extract authentication token${NC}" | tee -a "$OUTPUT_FILE"
    return 1
  fi
  
  echo -e "${GREEN}Successfully authenticated${NC}" | tee -a "$OUTPUT_FILE"
  return 0
}

# Function to check health endpoints
function testHealthEndpoints() {
  echo -e "${YELLOW}Testing health endpoints...${NC}" | tee -a "$OUTPUT_FILE"
  
  # Basic health check
  local response=$(callApi "health")
  if [ $? -ne 0 ]; then
    echo -e "${RED}Basic health check failed${NC}" | tee -a "$OUTPUT_FILE"
    return 1
  fi
  
  local status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d':' -f2 | tr -d '"')
  if [ "$status" != "pass" ]; then
    echo -e "${RED}Health check returned status: $status${NC}" | tee -a "$OUTPUT_FILE"
    return 1
  fi
  
  echo -e "${GREEN}Basic health check passed${NC}" | tee -a "$OUTPUT_FILE"
  
  if [ "$TEST_MODE" != "basic" ]; then
    # Detailed health check
    local response=$(callApi "health/detailed")
    if [ $? -ne 0 ]; then
      echo -e "${RED}Detailed health check failed${NC}" | tee -a "$OUTPUT_FILE"
      return 1
    }
    
    local status=$(echo "$response" | grep -o '"status":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')
    if [ "$status" != "pass" ]; then
      echo -e "${RED}Detailed health check returned status: $status${NC}" | tee -a "$OUTPUT_FILE"
      return 1
    fi
    
    echo -e "${GREEN}Detailed health check passed${NC}" | tee -a "$OUTPUT_FILE"
  fi
  
  return 0
}

# Function to test authentication endpoints
function testAuthEndpoints() {
  echo -e "${YELLOW}Testing authentication endpoints...${NC}" | tee -a "$OUTPUT_FILE"
  
  # Login
  local payload="{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}"
  local response=$(callApi "auth/login" "POST" "$payload")
  if [ $? -ne 0 ]; then
    echo -e "${RED}Login endpoint test failed${NC}" | tee -a "$OUTPUT_FILE"
    return 1
  fi
  
  # Extract token
  local token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d':' -f2 | tr -d '"')
  if [ -z "$token" ]; then
    echo -e "${RED}Failed to extract token from login response${NC}" | tee -a "$OUTPUT_FILE"
    return 1
  fi
  
  echo -e "${GREEN}Login endpoint test passed${NC}" | tee -a "$OUTPUT_FILE"
  
  # Test invalid login
  local payload="{\"username\":\"$USERNAME\",\"password\":\"wrongpassword\"}"
  local response=$(callApi "auth/login" "POST" "$payload")
  local http_code=$(echo "$response" | grep -o '"statusCode":[0-9]*' | cut -d':' -f2)
  
  if [ "$http_code" != "401" ] && [ "$http_code" != "400" ]; then
    echo -e "${RED}Invalid login test failed - expected 401 or 400, got $http_code${NC}" | tee -a "$OUTPUT_FILE"
    return 1
  fi
  
  echo -e "${GREEN}Invalid login endpoint test passed${NC}" | tee -a "$OUTPUT_FILE"
  
  # Test current user endpoint (if not in basic mode)
  if [ "$TEST_MODE" != "basic" ]; then
    local response=$(callApi "auth/me" "GET" "" "$AUTH_TOKEN")
    if [ $? -ne 0 ]; then
      echo -e "${RED}Current user endpoint test failed${NC}" | tee -a "$OUTPUT_FILE"
      return 1
    fi
    
    local username=$(echo "$response" | grep -o '"username":"[^"]*"' | cut -d':' -f2 | tr -d '"')
    if [ "$username" != "$USERNAME" ]; then
      echo -e "${RED}Current user endpoint returned wrong username: $username${NC}" | tee -a "$OUTPUT_FILE"
      return 1
    }
    
    echo -e "${GREEN}Current user endpoint test passed${NC}" | tee -a "$OUTPUT_FILE"
  fi
  
  return 0
}

# Function to test document endpoints
function testDocumentEndpoints() {
  echo -e "${YELLOW}Testing document endpoints...${NC}" | tee -a "$OUTPUT_FILE"
  
  # List documents
  local response=$(callApi "documents" "GET" "" "$AUTH_TOKEN")
  if [ $? -ne 0 ]; then
    echo -e "${RED}List documents endpoint test failed${NC}" | tee -a "$OUTPUT_FILE"
    return 1
  fi
  
  # Check if response contains documents array
  if ! echo "$response" | grep -q "documents"; then
    echo -e "${RED}List documents response doesn't contain documents array${NC}" | tee -a "$OUTPUT_FILE"
    return 1
  fi
  
  echo -e "${GREEN}List documents endpoint test passed${NC}" | tee -a "$OUTPUT_FILE"
  
  # If not in basic mode, test more document endpoints
  if [ "$TEST_MODE" != "basic" ]; then
    # Get document by ID (extract first document ID from list)
    local doc_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')
    
    if [ -n "$doc_id" ]; then
      local response=$(callApi "documents/$doc_id" "GET" "" "$AUTH_TOKEN")
      if [ $? -ne 0 ]; then
        echo -e "${RED}Get document by ID endpoint test failed${NC}" | tee -a "$OUTPUT_FILE"
        return 1
      fi
      
      # Check if response contains the document ID
      if ! echo "$response" | grep -q "\"id\":\"$doc_id\""; then
        echo -e "${RED}Get document by ID response doesn't contain the requested document${NC}" | tee -a "$OUTPUT_FILE"
        return 1
      fi
      
      echo -e "${GREEN}Get document by ID endpoint test passed${NC}" | tee -a "$OUTPUT_FILE"
    else
      echo -e "${YELLOW}Skipping document detail tests - no documents found${NC}" | tee -a "$OUTPUT_FILE"
    fi
    
    # Test document search if in end-to-end mode
    if [ "$TEST_MODE" == "end-to-end" ] && [ -n "$doc_id" ]; then
      # Extract a word from the document title to search for
      local search_term=$(echo "$response" | grep -o '"title":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"' | cut -d' ' -f1)
      
      if [ -n "$search_term" ]; then
        local response=$(callApi "documents/search?q=$search_term" "GET" "" "$AUTH_TOKEN")
        if [ $? -ne 0 ]; then
          echo -e "${RED}Document search endpoint test failed${NC}" | tee -a "$OUTPUT_FILE"
          return 1
        fi
        
        # Check if response contains documents
        if ! echo "$response" | grep -q "documents"; then
          echo -e "${RED}Document search response doesn't contain results${NC}" | tee -a "$OUTPUT_FILE"
          return 1
        fi
        
        echo -e "${GREEN}Document search endpoint test passed${NC}" | tee -a "$OUTPUT_FILE"
      else
        echo -e "${YELLOW}Skipping document search test - couldn't extract search term${NC}" | tee -a "$OUTPUT_FILE"
      fi
    fi
  fi
  
  return 0
}

# Function to test employee endpoints
function testEmployeeEndpoints() {
  echo -e "${YELLOW}Testing employee endpoints...${NC}" | tee -a "$OUTPUT_FILE"
  
  # List employees
  local response=$(callApi "employees" "GET" "" "$AUTH_TOKEN")
  if [ $? -ne 0 ]; then
    echo -e "${RED}List employees endpoint test failed${NC}" | tee -a "$OUTPUT_FILE"
    return 1
  fi
  
  # Check if response contains employees array
  if ! echo "$response" | grep -q "employees"; then
    echo -e "${RED}List employees response doesn't contain employees array${NC}" | tee -a "$OUTPUT_FILE"
    return 1
  fi
  
  echo -e "${GREEN}List employees endpoint test passed${NC}" | tee -a "$OUTPUT_FILE"
  
  # If not in basic mode, test more employee endpoints
  if [ "$TEST_MODE" != "basic" ]; then
    # Get employee by ID (extract first employee ID from list)
    local emp_id=$(echo "$response" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    
    if [ -n "$emp_id" ]; then
      local response=$(callApi "employees/$emp_id" "GET" "" "$AUTH_TOKEN")
      if [ $? -ne 0 ]; then
        echo -e "${RED}Get employee by ID endpoint test failed${NC}" | tee -a "$OUTPUT_FILE"
        return 1
      fi
      
      # Check if response contains the employee ID
      if ! echo "$response" | grep -q "\"id\":$emp_id"; then
        echo -e "${RED}Get employee by ID response doesn't contain the requested employee${NC}" | tee -a "$OUTPUT_FILE"
        return 1
      fi
      
      echo -e "${GREEN}Get employee by ID endpoint test passed${NC}" | tee -a "$OUTPUT_FILE"
      
      # Test employee search if in end-to-end mode
      if [ "$TEST_MODE" == "end-to-end" ]; then
        # Extract employee first name to search for
        local search_term=$(echo "$response" | grep -o '"firstName":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')
        
        if [ -n "$search_term" ]; then
          local response=$(callApi "employees/search?q=$search_term" "GET" "" "$AUTH_TOKEN")
          if [ $? -ne 0 ]; then
            echo -e "${RED}Employee search endpoint test failed${NC}" | tee -a "$OUTPUT_FILE"
            return 1
          fi
          
          # Check if response contains employees
          if ! echo "$response" | grep -q "employees"; then
            echo -e "${RED}Employee search response doesn't contain results${NC}" | tee -a "$OUTPUT_FILE"
            return 1
          fi
          
          echo -e "${GREEN}Employee search endpoint test passed${NC}" | tee -a "$OUTPUT_FILE"
        else
          echo -e "${YELLOW}Skipping employee search test - couldn't extract search term${NC}" | tee -a "$OUTPUT_FILE"
        fi
      fi
    else
      echo -e "${YELLOW}Skipping employee detail tests - no employees found${NC}" | tee -a "$OUTPUT_FILE"
    fi
  fi
  
  return 0
}

# Main function
function main() {
  echo -e "${YELLOW}BlueEarthOne API Test Tool${NC}" | tee -a "$OUTPUT_FILE"
  echo "Target API: $API_BASE" | tee -a "$OUTPUT_FILE"
  echo "Test mode: $TEST_MODE" | tee -a "$OUTPUT_FILE"
  echo "Output file: $OUTPUT_FILE" | tee -a "$OUTPUT_FILE"
  echo "----------------------------------------" | tee -a "$OUTPUT_FILE"
  echo "Starting tests at $(date)" | tee -a "$OUTPUT_FILE"
  echo "" | tee -a "$OUTPUT_FILE"
  
  # Test health endpoints first (these should work without auth)
  testHealthEndpoints
  if [ $? -ne 0 ]; then
    echo -e "${RED}Health endpoint tests failed, aborting further tests${NC}" | tee -a "$OUTPUT_FILE"
    exit 1
  fi
  
  # Authenticate for further tests
  authenticate
  if [ $? -ne 0 ]; then
    echo -e "${RED}Authentication failed, aborting further tests${NC}" | tee -a "$OUTPUT_FILE"
    exit 1
  fi
  
  # Run authentication endpoint tests
  testAuthEndpoints
  
  # Run document endpoint tests
  testDocumentEndpoints
  
  # Run employee endpoint tests
  testEmployeeEndpoints
  
  echo "" | tee -a "$OUTPUT_FILE"
  echo "----------------------------------------" | tee -a "$OUTPUT_FILE"
  echo -e "${GREEN}API tests completed successfully!${NC}" | tee -a "$OUTPUT_FILE"
  echo "See $OUTPUT_FILE for full test results" | tee -a "$OUTPUT_FILE"
}

# Execute main function
main "$@"