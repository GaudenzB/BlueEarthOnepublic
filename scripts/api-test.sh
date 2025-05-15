#!/bin/bash

# BlueEarthOne API Testing Script
# Usage: ./api-test.sh [--mode basic|detailed|e2e] [--output text|json] [--endpoint API_ENDPOINT]

# Default values
MODE="basic"
OUTPUT_FORMAT="text"
API_ENDPOINT="http://localhost:3000"
AUTH_TOKEN=""
TOKEN_FILE=".auth_token"
TEST_ENV="test"

# Process command-line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --mode)
      MODE="$2"
      shift 2
      ;;
    --output)
      OUTPUT_FORMAT="$2"
      shift 2
      ;;
    --endpoint)
      API_ENDPOINT="$2"
      shift 2
      ;;
    --env)
      TEST_ENV="$2"
      shift 2
      ;;
    --token)
      AUTH_TOKEN="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [--mode basic|detailed|e2e] [--output text|json] [--endpoint API_ENDPOINT] [--env test|dev|staging|prod] [--token AUTH_TOKEN]"
      echo
      echo "Options:"
      echo "  --mode MODE         Test mode (basic, detailed, e2e). Default: basic"
      echo "  --output FORMAT     Output format (text, json). Default: text"
      echo "  --endpoint URL      API endpoint base URL. Default: http://localhost:3000"
      echo "  --env ENV           Test environment (test, dev, staging, prod). Default: test"
      echo "  --token TOKEN       Authentication token to use for API calls"
      echo "  --help              Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run '$0 --help' for usage information."
      exit 1
      ;;
  esac
done

# Validate mode option
if [[ "$MODE" != "basic" && "$MODE" != "detailed" && "$MODE" != "e2e" ]]; then
  echo "Error: Invalid mode. Must be one of: basic, detailed, e2e."
  exit 1
fi

# Validate output format
if [[ "$OUTPUT_FORMAT" != "text" && "$OUTPUT_FORMAT" != "json" ]]; then
  echo "Error: Invalid output format. Must be one of: text, json."
  exit 1
fi

# Validate test environment
if [[ "$TEST_ENV" != "test" && "$TEST_ENV" != "dev" && "$TEST_ENV" != "staging" && "$TEST_ENV" != "prod" ]]; then
  echo "Error: Invalid test environment. Must be one of: test, dev, staging, prod."
  exit 1
fi

# Initialize results
declare -A results
status="pass"
started_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
test_count=0
pass_count=0
fail_count=0

# Function to perform HTTP request with timeout
function do_request() {
  local method=$1
  local url=$2
  local data=$3
  local timeout=${4:-5}
  local headers=()
  
  # Add authorization header if token is available
  if [[ -n "$AUTH_TOKEN" ]]; then
    headers+=("-H" "Authorization: Bearer $AUTH_TOKEN")
  fi
  
  local start_time=$(date +%s.%N)
  
  # Execute the appropriate curl command based on the HTTP method
  local response=""
  local http_code=""
  
  case "$method" in
    "GET")
      response=$(curl -s -w "\n%{http_code}" -m "$timeout" -X GET "${headers[@]}" "$url" 2>/dev/null)
      ;;
    "POST")
      headers+=("-H" "Content-Type: application/json")
      response=$(curl -s -w "\n%{http_code}" -m "$timeout" -X POST "${headers[@]}" -d "$data" "$url" 2>/dev/null)
      ;;
    "PUT")
      headers+=("-H" "Content-Type: application/json")
      response=$(curl -s -w "\n%{http_code}" -m "$timeout" -X PUT "${headers[@]}" -d "$data" "$url" 2>/dev/null)
      ;;
    "DELETE")
      response=$(curl -s -w "\n%{http_code}" -m "$timeout" -X DELETE "${headers[@]}" "$url" 2>/dev/null)
      ;;
    *)
      echo "Error: Unsupported HTTP method '$method'"
      return 1
      ;;
  esac
  
  # Extract HTTP status code from the response
  http_code=$(echo "$response" | tail -n1)
  # Extract the response body by removing the status code line
  body=$(echo "$response" | sed '$d')
  
  local end_time=$(date +%s.%N)
  local resp_time=$(echo "$end_time - $start_time" | bc)
  
  echo "$http_code|$resp_time|$body"
}

# Function to handle test result reporting
function record_test_result() {
  local test_name=$1
  local result=$2
  local message=$3
  local resp_time=$4
  local status_code=$5
  local response_body=$6
  
  ((test_count++))
  
  if [[ "$result" == "pass" ]]; then
    ((pass_count++))
    results["$test_name"]="pass|$message|$resp_time|$status_code|$response_body"
  else
    ((fail_count++))
    results["$test_name"]="fail|$message|$resp_time|$status_code|$response_body"
    status="fail"
  fi
}

# Function to authenticate and get token
function authenticate() {
  local auth_url="${API_ENDPOINT}/api/auth/login"
  local credentials='{"username":"admin","password":"password123"}'
  
  echo "Authenticating with the API..."
  
  local result=$(do_request "POST" "$auth_url" "$credentials" 10)
  local http_code=$(echo "$result" | cut -d'|' -f1)
  local resp_time=$(echo "$result" | cut -d'|' -f2)
  local response_body=$(echo "$result" | cut -d'|' -f3-)
  
  if [[ "$http_code" -eq 200 || "$http_code" -eq 201 ]]; then
    # Extract token from response body
    if [[ "$response_body" == *"token"* ]]; then
      # Using grep to extract the token value
      AUTH_TOKEN=$(echo "$response_body" | grep -o '"token":"[^"]*"' | cut -d':' -f2 | tr -d '"')
      
      if [[ -n "$AUTH_TOKEN" ]]; then
        echo "$AUTH_TOKEN" > "$TOKEN_FILE"
        record_test_result "authentication" "pass" "Successfully authenticated with the API" "$resp_time" "$http_code" "$response_body"
        return 0
      else
        record_test_result "authentication" "fail" "Failed to extract authentication token from response" "$resp_time" "$http_code" "$response_body"
        return 1
      fi
    else
      record_test_result "authentication" "fail" "Authentication response doesn't contain a token" "$resp_time" "$http_code" "$response_body"
      return 1
    fi
  else
    record_test_result "authentication" "fail" "Authentication failed with HTTP code $http_code" "$resp_time" "$http_code" "$response_body"
    return 1
  fi
}

# Function to run basic API tests
function run_basic_tests() {
  # Health check
  local health_url="${API_ENDPOINT}/api/health"
  local result=$(do_request "GET" "$health_url" "" 5)
  local http_code=$(echo "$result" | cut -d'|' -f1)
  local resp_time=$(echo "$result" | cut -d'|' -f2)
  local response_body=$(echo "$result" | cut -d'|' -f3-)
  
  if [[ "$http_code" -eq 200 ]]; then
    record_test_result "health_check" "pass" "Health check passed" "$resp_time" "$http_code" "$response_body"
  else
    record_test_result "health_check" "fail" "Health check failed with HTTP code $http_code" "$resp_time" "$http_code" "$response_body"
  fi
  
  # Authentication test (if no token provided)
  if [[ -z "$AUTH_TOKEN" ]]; then
    if [[ -f "$TOKEN_FILE" ]]; then
      AUTH_TOKEN=$(cat "$TOKEN_FILE")
      record_test_result "token_read" "pass" "Read authentication token from file" "0.001" "N/A" "N/A"
    else
      authenticate
    fi
  else
    record_test_result "token_provided" "pass" "Using provided authentication token" "0.001" "N/A" "N/A"
  fi
  
  # Test auth status endpoint
  if [[ -n "$AUTH_TOKEN" ]]; then
    local auth_status_url="${API_ENDPOINT}/api/auth/status"
    local result=$(do_request "GET" "$auth_status_url" "" 5)
    local http_code=$(echo "$result" | cut -d'|' -f1)
    local resp_time=$(echo "$result" | cut -d'|' -f2)
    local response_body=$(echo "$result" | cut -d'|' -f3-)
    
    if [[ "$http_code" -eq 200 ]]; then
      record_test_result "auth_status" "pass" "Auth status check passed" "$resp_time" "$http_code" "$response_body"
    else
      record_test_result "auth_status" "fail" "Auth status check failed with HTTP code $http_code" "$resp_time" "$http_code" "$response_body"
    fi
  fi
}

# Function to run detailed API tests
function run_detailed_tests() {
  # Run basic tests first
  run_basic_tests
  
  # Employees endpoint test
  local employees_url="${API_ENDPOINT}/api/employees"
  local result=$(do_request "GET" "$employees_url" "" 5)
  local http_code=$(echo "$result" | cut -d'|' -f1)
  local resp_time=$(echo "$result" | cut -d'|' -f2)
  local response_body=$(echo "$result" | cut -d'|' -f3-)
  
  if [[ "$http_code" -eq 200 ]]; then
    record_test_result "get_employees" "pass" "Successfully retrieved employees" "$resp_time" "$http_code" "$response_body"
  else
    record_test_result "get_employees" "fail" "Failed to retrieve employees with HTTP code $http_code" "$resp_time" "$http_code" "$response_body"
  fi
  
  # Documents endpoint test
  local documents_url="${API_ENDPOINT}/api/documents"
  local result=$(do_request "GET" "$documents_url" "" 5)
  local http_code=$(echo "$result" | cut -d'|' -f1)
  local resp_time=$(echo "$result" | cut -d'|' -f2)
  local response_body=$(echo "$result" | cut -d'|' -f3-)
  
  if [[ "$http_code" -eq 200 ]]; then
    record_test_result "get_documents" "pass" "Successfully retrieved documents" "$resp_time" "$http_code" "$response_body"
  else
    record_test_result "get_documents" "fail" "Failed to retrieve documents with HTTP code $http_code" "$resp_time" "$http_code" "$response_body"
  fi
  
  # Create test document
  local create_document_url="${API_ENDPOINT}/api/documents"
  local document_data='{"title":"Test Document","content":"This is a test document created by the API test script.","status":"draft","visibility":"private"}'
  local result=$(do_request "POST" "$create_document_url" "$document_data" 10)
  local http_code=$(echo "$result" | cut -d'|' -f1)
  local resp_time=$(echo "$result" | cut -d'|' -f2)
  local response_body=$(echo "$result" | cut -d'|' -f3-)
  
  if [[ "$http_code" -eq 201 || "$http_code" -eq 200 ]]; then
    # Extract document ID for later use
    local document_id=$(echo "$response_body" | grep -o '"id":"[^"]*"' | cut -d':' -f2 | tr -d '"')
    
    record_test_result "create_document" "pass" "Successfully created test document" "$resp_time" "$http_code" "$response_body"
    
    # Get document by ID
    if [[ -n "$document_id" ]]; then
      local get_document_url="${API_ENDPOINT}/api/documents/${document_id}"
      local result=$(do_request "GET" "$get_document_url" "" 5)
      local http_code=$(echo "$result" | cut -d'|' -f1)
      local resp_time=$(echo "$result" | cut -d'|' -f2)
      local response_body=$(echo "$result" | cut -d'|' -f3-)
      
      if [[ "$http_code" -eq 200 ]]; then
        record_test_result "get_document_by_id" "pass" "Successfully retrieved document by ID" "$resp_time" "$http_code" "$response_body"
      else
        record_test_result "get_document_by_id" "fail" "Failed to retrieve document by ID with HTTP code $http_code" "$resp_time" "$http_code" "$response_body"
      fi
      
      # Update document
      local update_document_url="${API_ENDPOINT}/api/documents/${document_id}"
      local updated_data='{"title":"Updated Test Document","content":"This document has been updated by the API test script.","status":"published","visibility":"public"}'
      local result=$(do_request "PUT" "$update_document_url" "$updated_data" 10)
      local http_code=$(echo "$result" | cut -d'|' -f1)
      local resp_time=$(echo "$result" | cut -d'|' -f2)
      local response_body=$(echo "$result" | cut -d'|' -f3-)
      
      if [[ "$http_code" -eq 200 ]]; then
        record_test_result "update_document" "pass" "Successfully updated test document" "$resp_time" "$http_code" "$response_body"
      else
        record_test_result "update_document" "fail" "Failed to update document with HTTP code $http_code" "$resp_time" "$http_code" "$response_body"
      fi
      
      # Delete document
      local delete_document_url="${API_ENDPOINT}/api/documents/${document_id}"
      local result=$(do_request "DELETE" "$delete_document_url" "" 5)
      local http_code=$(echo "$result" | cut -d'|' -f1)
      local resp_time=$(echo "$result" | cut -d'|' -f2)
      local response_body=$(echo "$result" | cut -d'|' -f3-)
      
      if [[ "$http_code" -eq 200 || "$http_code" -eq 204 ]]; then
        record_test_result "delete_document" "pass" "Successfully deleted test document" "$resp_time" "$http_code" "$response_body"
      else
        record_test_result "delete_document" "fail" "Failed to delete document with HTTP code $http_code" "$resp_time" "$http_code" "$response_body"
      fi
    else
      record_test_result "extract_document_id" "fail" "Failed to extract document ID from create response" "$resp_time" "$http_code" "$response_body"
    fi
  else
    record_test_result "create_document" "fail" "Failed to create test document with HTTP code $http_code" "$resp_time" "$http_code" "$response_body"
  fi
}

# Function to run end-to-end API tests
function run_e2e_tests() {
  # Run detailed tests first
  run_detailed_tests
  
  # Employee creation and management flow
  local create_employee_url="${API_ENDPOINT}/api/employees"
  local employee_data='{"firstName":"John","lastName":"Doe","email":"john.doe.test@example.com","department":"Engineering","title":"Software Engineer","phoneNumber":"555-123-4567"}'
  local result=$(do_request "POST" "$create_employee_url" "$employee_data" 10)
  local http_code=$(echo "$result" | cut -d'|' -f1)
  local resp_time=$(echo "$result" | cut -d'|' -f2)
  local response_body=$(echo "$result" | cut -d'|' -f3-)
  
  if [[ "$http_code" -eq 201 || "$http_code" -eq 200 ]]; then
    # Extract employee ID for later use
    local employee_id=$(echo "$response_body" | grep -o '"id":[0-9]*' | cut -d':' -f2 | tr -d '"')
    
    record_test_result "create_employee" "pass" "Successfully created test employee" "$resp_time" "$http_code" "$response_body"
    
    # Get employee by ID
    if [[ -n "$employee_id" ]]; then
      local get_employee_url="${API_ENDPOINT}/api/employees/${employee_id}"
      local result=$(do_request "GET" "$get_employee_url" "" 5)
      local http_code=$(echo "$result" | cut -d'|' -f1)
      local resp_time=$(echo "$result" | cut -d'|' -f2)
      local response_body=$(echo "$result" | cut -d'|' -f3-)
      
      if [[ "$http_code" -eq 200 ]]; then
        record_test_result "get_employee_by_id" "pass" "Successfully retrieved employee by ID" "$resp_time" "$http_code" "$response_body"
      else
        record_test_result "get_employee_by_id" "fail" "Failed to retrieve employee by ID with HTTP code $http_code" "$resp_time" "$http_code" "$response_body"
      fi
      
      # Update employee
      local update_employee_url="${API_ENDPOINT}/api/employees/${employee_id}"
      local updated_employee_data='{"firstName":"John","lastName":"Doe","email":"john.doe.updated@example.com","department":"Product","title":"Senior Software Engineer","phoneNumber":"555-987-6543"}'
      local result=$(do_request "PUT" "$update_employee_url" "$updated_employee_data" 10)
      local http_code=$(echo "$result" | cut -d'|' -f1)
      local resp_time=$(echo "$result" | cut -d'|' -f2)
      local response_body=$(echo "$result" | cut -d'|' -f3-)
      
      if [[ "$http_code" -eq 200 ]]; then
        record_test_result "update_employee" "pass" "Successfully updated test employee" "$resp_time" "$http_code" "$response_body"
      else
        record_test_result "update_employee" "fail" "Failed to update employee with HTTP code $http_code" "$resp_time" "$http_code" "$response_body"
      fi
      
      # Search for employee
      local search_url="${API_ENDPOINT}/api/employees/search?q=john.doe"
      local result=$(do_request "GET" "$search_url" "" 5)
      local http_code=$(echo "$result" | cut -d'|' -f1)
      local resp_time=$(echo "$result" | cut -d'|' -f2)
      local response_body=$(echo "$result" | cut -d'|' -f3-)
      
      if [[ "$http_code" -eq 200 ]]; then
        if [[ "$response_body" == *"john.doe"* ]]; then
          record_test_result "search_employee" "pass" "Successfully searched for and found employee" "$resp_time" "$http_code" "$response_body"
        else
          record_test_result "search_employee" "fail" "Search completed but employee not found in results" "$resp_time" "$http_code" "$response_body"
        fi
      else
        record_test_result "search_employee" "fail" "Failed to search for employee with HTTP code $http_code" "$resp_time" "$http_code" "$response_body"
      fi
      
      # Filter employees by department
      local filter_url="${API_ENDPOINT}/api/employees?department=Product"
      local result=$(do_request "GET" "$filter_url" "" 5)
      local http_code=$(echo "$result" | cut -d'|' -f1)
      local resp_time=$(echo "$result" | cut -d'|' -f2)
      local response_body=$(echo "$result" | cut -d'|' -f3-)
      
      if [[ "$http_code" -eq 200 ]]; then
        if [[ "$response_body" == *"john.doe"* ]]; then
          record_test_result "filter_employees" "pass" "Successfully filtered employees by department" "$resp_time" "$http_code" "$response_body"
        else
          record_test_result "filter_employees" "fail" "Filter completed but employee not found in results" "$resp_time" "$http_code" "$response_body"
        fi
      else
        record_test_result "filter_employees" "fail" "Failed to filter employees with HTTP code $http_code" "$resp_time" "$http_code" "$response_body"
      fi
      
      # Delete employee
      local delete_employee_url="${API_ENDPOINT}/api/employees/${employee_id}"
      local result=$(do_request "DELETE" "$delete_employee_url" "" 5)
      local http_code=$(echo "$result" | cut -d'|' -f1)
      local resp_time=$(echo "$result" | cut -d'|' -f2)
      local response_body=$(echo "$result" | cut -d'|' -f3-)
      
      if [[ "$http_code" -eq 200 || "$http_code" -eq 204 ]]; then
        record_test_result "delete_employee" "pass" "Successfully deleted test employee" "$resp_time" "$http_code" "$response_body"
      else
        record_test_result "delete_employee" "fail" "Failed to delete employee with HTTP code $http_code" "$resp_time" "$http_code" "$response_body"
      fi
    else
      record_test_result "extract_employee_id" "fail" "Failed to extract employee ID from create response" "$resp_time" "$http_code" "$response_body"
    fi
  else
    record_test_result "create_employee" "fail" "Failed to create test employee with HTTP code $http_code" "$resp_time" "$http_code" "$response_body"
  fi
  
  # Test SSO integration if configured
  local sso_url="${API_ENDPOINT}/api/auth/sso/status"
  local result=$(do_request "GET" "$sso_url" "" 5)
  local http_code=$(echo "$result" | cut -d'|' -f1)
  local resp_time=$(echo "$result" | cut -d'|' -f2)
  local response_body=$(echo "$result" | cut -d'|' -f3-)
  
  if [[ "$http_code" -eq 200 ]]; then
    record_test_result "sso_status" "pass" "SSO integration status check passed" "$resp_time" "$http_code" "$response_body"
  else
    # Not failing the entire test suite for SSO issues, just logging
    record_test_result "sso_status" "warn" "SSO integration status check returned HTTP code $http_code" "$resp_time" "$http_code" "$response_body"
  fi
}

# Run the appropriate test suite based on the specified mode
case "$MODE" in
  "basic")
    run_basic_tests
    ;;
  "detailed")
    run_detailed_tests
    ;;
  "e2e")
    run_e2e_tests
    ;;
esac

completed_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
duration=$(echo "$(date -d "$completed_at" +%s) - $(date -d "$started_at" +%s)" | bc)

# Output results based on specified format
if [[ "$OUTPUT_FORMAT" == "json" ]]; then
  # Start JSON output
  echo "{"
  echo "  \"status\": \"$status\","
  echo "  \"summary\": {"
  echo "    \"total\": $test_count,"
  echo "    \"passed\": $pass_count,"
  echo "    \"failed\": $fail_count,"
  echo "    \"duration\": $duration"
  echo "  },"
  echo "  \"timestamp\": \"$completed_at\","
  echo "  \"mode\": \"$MODE\","
  echo "  \"endpoint\": \"$API_ENDPOINT\","
  echo "  \"environment\": \"$TEST_ENV\","
  echo "  \"tests\": {"
  
  # Process each result
  first=true
  for key in "${!results[@]}"; do
    if [[ "$first" == "true" ]]; then
      first=false
    else
      echo ","
    fi
    
    result_fields=(${results[$key]//|/ })
    result_status=${result_fields[0]}
    result_message=${result_fields[1]}
    result_time=${result_fields[2]}
    result_code=${result_fields[3]}
    
    # Escape quotes in the message
    result_message=$(echo "$result_message" | sed 's/"/\\"/g')
    
    echo -n "    \"$key\": {"
    echo -n "\"status\": \"$result_status\", "
    echo -n "\"message\": \"$result_message\", "
    echo -n "\"responseTime\": $result_time, "
    echo -n "\"statusCode\": \"$result_code\""
    echo -n "}"
  done
  
  # Close JSON structure
  echo ""
  echo "  }"
  echo "}"
else
  # Text output
  echo "BlueEarthOne API Test Report"
  echo "============================"
  echo "Status: $status"
  echo "Environment: $TEST_ENV"
  echo "Mode: $MODE"
  echo "API Endpoint: $API_ENDPOINT"
  echo "Time: $completed_at"
  echo "Duration: $duration seconds"
  echo "Summary: $pass_count/$test_count tests passed, $fail_count failed"
  echo ""
  echo "Results:"
  
  # Sort keys for consistent output
  for key in $(echo ${!results[@]} | tr ' ' '\n' | sort); do
    IFS='|' read -r result_status result_message result_time result_code result_body <<< "${results[$key]}"
    
    # Format output with appropriate colors if outputting to a terminal
    status_color=""
    reset_color=""
    if [[ -t 1 ]]; then  # Check if stdout is a terminal
      reset_color="\033[0m"
      if [[ "$result_status" == "pass" ]]; then
        status_color="\033[32m"  # Green
      elif [[ "$result_status" == "warn" ]]; then
        status_color="\033[33m"  # Yellow
      else
        status_color="\033[31m"  # Red
      fi
    fi
    
    printf "  %s[%s]%s %s - %s (%.2fs, HTTP %s)\n" "$status_color" "$result_status" "$reset_color" "$key" "$result_message" "$result_time" "$result_code"
  done
fi

# Return appropriate exit code
if [[ "$status" == "fail" ]]; then
  exit 1
else
  exit 0
fi