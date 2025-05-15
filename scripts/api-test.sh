#!/bin/bash
# Simple API test script to check critical endpoints

# Default API URL
API_URL=${1:-"http://localhost:5000"}

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Print header
echo "=============================================="
echo "API Endpoint Tests - $(date)"
echo "Testing against: $API_URL"
echo "=============================================="

# Function to test an endpoint
test_endpoint() {
    local endpoint=$1
    local method=${2:-"GET"}
    local expected_status=${3:-200}
    local payload=$4
    
    echo -n "Testing $method $endpoint (expecting $expected_status): "
    
    # Build the curl command based on method and payload
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method $API_URL$endpoint)
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method -H "Content-Type: application/json" -d "$payload" $API_URL$endpoint)
    fi
    
    # Check if the response status matches the expected status
    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}PASS${NC}"
        return 0
    else
        echo -e "${RED}FAIL${NC} - Got status $response"
        return 1
    fi
}

# Function to run all tests and count successes/failures
run_all_tests() {
    local pass_count=0
    local fail_count=0
    
    # Test root endpoint
    test_endpoint "/"
    if [ $? -eq 0 ]; then ((pass_count++)); else ((fail_count++)); fi
    
    # Test health endpoint
    test_endpoint "/api/health"
    if [ $? -eq 0 ]; then ((pass_count++)); else ((fail_count++)); fi
    
    # Test health/db endpoint
    test_endpoint "/api/health/db"
    if [ $? -eq 0 ]; then ((pass_count++)); else ((fail_count++)); fi
    
    # Test auth endpoint (expect 401 if not authenticated)
    test_endpoint "/api/auth/me" "GET" 401
    if [ $? -eq 0 ]; then ((pass_count++)); else ((fail_count++)); fi
    
    # Test login endpoint with invalid credentials (expect 401)
    test_endpoint "/api/auth/login" "POST" 401 '{"username":"test","password":"wrongpassword"}'
    if [ $? -eq 0 ]; then ((pass_count++)); else ((fail_count++)); fi
    
    # Test employees endpoint without authentication (expect 401)
    test_endpoint "/api/employees" "GET" 401
    if [ $? -eq 0 ]; then ((pass_count++)); else ((fail_count++)); fi
    
    # Test documents endpoint without authentication (expect 401)
    test_endpoint "/api/documents" "GET" 401
    if [ $? -eq 0 ]; then ((pass_count++)); else ((fail_count++)); fi
    
    # Print summary
    echo "=============================================="
    echo "Test Summary:"
    echo "Pass: $pass_count"
    echo "Fail: $fail_count"
    echo "Total: $((pass_count + fail_count))"
    echo "=============================================="
    
    # Return success only if all tests passed
    if [ $fail_count -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# Run all tests
run_all_tests
exit $?