#!/bin/bash
# API Test Script
# Tests critical API endpoints to ensure they're functioning correctly

# Configuration
API_BASE_URL=${API_BASE_URL:-"http://localhost:3000/api"}
AUTH_TOKEN=${AUTH_TOKEN:-""}
OUTPUT_FORMAT=${OUTPUT_FORMAT:-"detailed"} # simple or detailed
TIMEOUT=${TIMEOUT:-5}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log messages with timestamps
log() {
  echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to test an API endpoint
test_endpoint() {
  local method=$1
  local endpoint=$2
  local expected_status=$3
  local request_body=$4
  local description=$5
  
  # Build curl command
  curl_cmd="curl -s -X ${method} -m ${TIMEOUT} -w '%{http_code}' -o /tmp/api_response"
  
  # Add authentication header if token provided
  if [ ! -z "$AUTH_TOKEN" ]; then
    curl_cmd="$curl_cmd -H \"Authorization: Bearer ${AUTH_TOKEN}\""
  fi
  
  # Add Content-Type for requests with bodies
  if [ ! -z "$request_body" ]; then
    curl_cmd="$curl_cmd -H \"Content-Type: application/json\" -d '${request_body}'"
  fi
  
  # Add the URL
  curl_cmd="$curl_cmd ${API_BASE_URL}${endpoint}"
  
  # Execute the curl command
  log "${BLUE}Testing:${NC} ${method} ${endpoint} - ${description}"
  http_status=$(eval $curl_cmd)
  
  # Check if status matches expected
  if [ "$http_status" == "$expected_status" ]; then
    log "${GREEN}✓ Success:${NC} ${method} ${endpoint} returned ${http_status} as expected"
    
    if [ "$OUTPUT_FORMAT" == "detailed" ]; then
      # Show response for successful requests in detailed mode
      echo -e "  Response:"
      cat /tmp/api_response | jq . 2>/dev/null || cat /tmp/api_response
      echo ""
    fi
    
    return 0
  else
    log "${RED}✗ Failed:${NC} ${method} ${endpoint} returned ${http_status}, expected ${expected_status}"
    
    # Always show response for failed requests
    echo -e "  Response:"
    cat /tmp/api_response | jq . 2>/dev/null || cat /tmp/api_response
    echo ""
    
    return 1
  fi
}

# Function to run all tests
run_tests() {
  local failed=0
  local total=0
  local start_time=$(date +%s)
  
  log "${BLUE}Starting API tests against ${API_BASE_URL}${NC}"
  
  # Basic health endpoints
  test_endpoint "GET" "/health" 200 "" "Basic health check"
  if [ $? -ne 0 ]; then failed=$((failed+1)); fi
  total=$((total+1))
  
  test_endpoint "GET" "/health/detailed" 200 "" "Detailed health check"
  if [ $? -ne 0 ]; then failed=$((failed+1)); fi
  total=$((total+1))
  
  test_endpoint "GET" "/health/deep" 200 "" "Deep health check"
  if [ $? -ne 0 ]; then failed=$((failed+1)); fi
  total=$((total+1))
  
  # Authentication endpoints 
  test_endpoint "POST" "/auth/login" 400 '{"username":"invalid"}' "Invalid login (should fail)"
  if [ $? -ne 0 ]; then failed=$((failed+1)); fi
  total=$((total+1))
  
  # If we have a valid auth token, test protected endpoints
  if [ ! -z "$AUTH_TOKEN" ]; then
    test_endpoint "GET" "/auth/me" 200 "" "Get current user profile"
    if [ $? -ne 0 ]; then failed=$((failed+1)); fi
    total=$((total+1))
    
    test_endpoint "GET" "/documents" 200 "" "List documents"
    if [ $? -ne 0 ]; then failed=$((failed+1)); fi
    total=$((total+1))
    
    test_endpoint "GET" "/employees" 200 "" "List employees"
    if [ $? -ne 0 ]; then failed=$((failed+1)); fi
    total=$((total+1))
  else
    log "${YELLOW}Warning:${NC} Skipping authenticated endpoint tests. Provide AUTH_TOKEN to test these endpoints."
  fi
  
  # Calculate test duration
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  # Print test summary
  log "${BLUE}Test Summary:${NC}"
  log "Total tests: ${total}"
  log "Passed: ${GREEN}$((total-failed))${NC}"
  log "Failed: ${failed > 0 ? RED : GREEN}${failed}${NC}"
  log "Duration: ${duration} seconds"
  
  # Return appropriate exit code
  if [ $failed -eq 0 ]; then
    log "${GREEN}All tests passed!${NC}"
    return 0
  else
    log "${RED}Some tests failed.${NC}"
    return 1
  fi
}

# Main entry point
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --url URL          Base URL for API (default: http://localhost:3000/api)"
  echo "  --token TOKEN      Authentication token for protected endpoints"
  echo "  --format FORMAT    Output format: 'simple' or 'detailed' (default: detailed)"
  echo "  --help, -h         Show this help message"
  echo ""
  echo "Environment variables:"
  echo "  API_BASE_URL       Same as --url"
  echo "  AUTH_TOKEN         Same as --token"
  echo "  OUTPUT_FORMAT      Same as --format"
  exit 0
fi

# Process command line arguments
while [ "$1" != "" ]; do
  case $1 in
    --url)
      shift
      API_BASE_URL=$1
      ;;
    --token)
      shift
      AUTH_TOKEN=$1
      ;;
    --format)
      shift
      OUTPUT_FORMAT=$1
      ;;
  esac
  shift
done

# Run the tests
run_tests
exit $?