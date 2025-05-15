#!/bin/bash

# API Testing Script for BlueEarthOne
# 
# This script tests critical API endpoints to verify that an
# application deployment is functioning correctly.
#
# Usage:
#   ./api-test.sh <base_url> [options]
#
# Options:
#   -t, --token <token>      Use auth token for authenticated endpoints
#   -c, --cookie <cookie>    Use auth cookie for authenticated endpoints
#   -f, --full               Run a full test suite (slower, more comprehensive)
#   -s, --summary            Show only summary results, not each test
#   -h, --help               Show this help message
#
# Examples:
#   ./api-test.sh https://blueearth.example.com
#   ./api-test.sh https://staging.blueearth.example.com --token "..."
#   ./api-test.sh https://blueearth.example.com --full --summary

set -e

# Default values
BASE_URL=""
AUTH_TOKEN=""
AUTH_COOKIE=""
RUN_FULL=false
SUMMARY_ONLY=false
TIMEOUT=10
VERBOSE=true

# Test results
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print usage
function print_usage {
    echo "API Testing Script for BlueEarthOne"
    echo ""
    echo "Usage: $0 <base_url> [options]"
    echo ""
    echo "Options:"
    echo "  -t, --token <token>      Use auth token for authenticated endpoints"
    echo "  -c, --cookie <cookie>    Use auth cookie for authenticated endpoints"
    echo "  -f, --full               Run a full test suite (slower, more comprehensive)"
    echo "  -s, --summary            Show only summary results, not each test"
    echo "  -v, --verbose            Show verbose output (default: true)"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 https://blueearth.example.com"
    echo "  $0 https://staging.blueearth.example.com --token \"...\""
    echo "  $0 https://blueearth.example.com --full --summary"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--token)
            AUTH_TOKEN="$2"
            shift 2
            ;;
        -c|--cookie)
            AUTH_COOKIE="$2"
            shift 2
            ;;
        -f|--full)
            RUN_FULL=true
            shift
            ;;
        -s|--summary)
            SUMMARY_ONLY=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        http*://*)
            BASE_URL="$1"
            shift
            ;;
        *)
            echo -e "${RED}Error: Unknown option $1${NC}"
            print_usage
            exit 1
            ;;
    esac
done

# Check if URL is provided
if [ -z "$BASE_URL" ]; then
    echo -e "${RED}Error: Base URL is required${NC}"
    print_usage
    exit 1
fi

# Remove trailing slash if present
BASE_URL=$(echo "$BASE_URL" | sed 's/\/$//')

# Print banner
echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}  BlueEarthOne API Test Suite  ${NC}"
echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}Base URL: ${BASE_URL}${NC}"
if [ -n "$AUTH_TOKEN" ]; then
    echo -e "${BLUE}Auth Mode: Bearer Token${NC}"
elif [ -n "$AUTH_COOKIE" ]; then
    echo -e "${BLUE}Auth Mode: Cookie${NC}"
else
    echo -e "${YELLOW}Auth Mode: Unauthenticated (some tests will be skipped)${NC}"
fi
if [ "$RUN_FULL" = true ]; then
    echo -e "${BLUE}Test Mode: Full test suite${NC}"
else
    echo -e "${BLUE}Test Mode: Basic test suite${NC}"
fi
echo -e "${BLUE}==============================================${NC}"
echo ""

# Helper function to log a test result
function log_test {
    local status="$1"
    local endpoint="$2"
    local message="$3"
    
    if [ "$status" = "PASS" ]; then
        if [ "$SUMMARY_ONLY" = false ]; then
            echo -e "${GREEN}[PASS]${NC} $endpoint - $message"
        fi
        TESTS_PASSED=$((TESTS_PASSED+1))
    elif [ "$status" = "FAIL" ]; then
        if [ "$SUMMARY_ONLY" = false ]; then
            echo -e "${RED}[FAIL]${NC} $endpoint - $message"
        fi
        TESTS_FAILED=$((TESTS_FAILED+1))
    elif [ "$status" = "SKIP" ]; then
        if [ "$SUMMARY_ONLY" = false ]; then
            echo -e "${YELLOW}[SKIP]${NC} $endpoint - $message"
        fi
        TESTS_SKIPPED=$((TESTS_SKIPPED+1))
    fi
    
    TESTS_TOTAL=$((TESTS_TOTAL+1))
}

# Helper function to run a test
function run_test {
    local method="$1"
    local endpoint="$2"
    local expected_status="$3"
    local description="$4"
    local auth_required="${5:-false}"
    local payload="$6"
    
    # Skip tests requiring auth if no token/cookie provided
    if [ "$auth_required" = true ] && [ -z "$AUTH_TOKEN" ] && [ -z "$AUTH_COOKIE" ]; then
        log_test "SKIP" "$endpoint" "$description (requires authentication)"
        return 0
    fi
    
    # Build the URL
    local url="${BASE_URL}${endpoint}"
    
    # Initialize curl command
    local curl_cmd="curl -s -X $method"
    curl_cmd+=" -m $TIMEOUT"  # Add timeout
    curl_cmd+=" -w '%{http_code}'"  # Output status code
    curl_cmd+=" -o /tmp/api_test_response"  # Save response to file
    
    # Add auth if provided
    if [ -n "$AUTH_TOKEN" ]; then
        curl_cmd+=" -H \"Authorization: Bearer $AUTH_TOKEN\""
    elif [ -n "$AUTH_COOKIE" ]; then
        curl_cmd+=" -H \"Cookie: $AUTH_COOKIE\""
    fi
    
    # Add content-type header for POST/PUT/PATCH requests
    if [ "$method" = "POST" ] || [ "$method" = "PUT" ] || [ "$method" = "PATCH" ]; then
        curl_cmd+=" -H \"Content-Type: application/json\""
    fi
    
    # Add payload if provided
    if [ -n "$payload" ]; then
        curl_cmd+=" -d '$payload'"
    fi
    
    # Add URL
    curl_cmd+=" \"$url\""
    
    # Run the command
    local status_code
    if [ "$VERBOSE" = true ] && [ "$SUMMARY_ONLY" = false ]; then
        echo "Running: $method $url"
    fi
    
    status_code=$(eval $curl_cmd)
    
    # Check if status code matches expected
    if [ "$status_code" = "$expected_status" ]; then
        log_test "PASS" "$endpoint" "$description (Status: $status_code)"
    else
        log_test "FAIL" "$endpoint" "$description (Expected: $expected_status, Got: $status_code)"
        if [ "$VERBOSE" = true ] && [ "$SUMMARY_ONLY" = false ]; then
            echo "Response:"
            cat /tmp/api_test_response
            echo ""
        fi
    fi
}

echo -e "${BLUE}Starting API tests...${NC}"
echo ""

# Test Group: Health Endpoints
echo -e "${BLUE}Testing Health Endpoints${NC}"
run_test "GET" "/api/health" 200 "Basic health check"
run_test "GET" "/api/health/detailed" 200 "Detailed health check"
if [ "$RUN_FULL" = true ]; then
    run_test "GET" "/api/health/deep" 200 "Deep health check"
fi

# Test Group: Authentication
echo -e "${BLUE}Testing Authentication Endpoints${NC}"
run_test "GET" "/api/auth/me" 401 "Unauthenticated user info should fail" false
run_test "GET" "/api/auth/me" 200 "Authenticated user info" true

# Test Group: Employees
echo -e "${BLUE}Testing Employee Endpoints${NC}"
run_test "GET" "/api/employees" 200 "List employees" true
run_test "GET" "/api/employees/1" 200 "Get employee by ID" true
if [ "$RUN_FULL" = true ]; then
    run_test "GET" "/api/employees?search=manager" 200 "Search employees" true
    run_test "GET" "/api/employees?department=engineering" 200 "Filter employees by department" true
    run_test "GET" "/api/employees?status=active" 200 "Filter employees by status" true
fi

# Test Group: Documents
echo -e "${BLUE}Testing Document Endpoints${NC}"
run_test "GET" "/api/documents" 200 "List documents" true
run_test "GET" "/api/documents/recent" 200 "Get recent documents" true
if [ "$RUN_FULL" = true ]; then
    run_test "GET" "/api/documents/search?query=test" 200 "Search documents" true
    
    # Test document creation with a minimal payload
    document_payload='{"title":"API Test Document","content":"This is a test document created by the API test script"}'
    run_test "POST" "/api/documents" 201 "Create document" true "$document_payload"
fi

# Print summary
echo ""
echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}  Test Summary  ${NC}"
echo -e "${BLUE}==============================================${NC}"
echo -e "Total Tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo -e "${YELLOW}Skipped: $TESTS_SKIPPED${NC}"
echo -e "${BLUE}==============================================${NC}"

# Exit with non-zero status if any tests failed
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}API testing failed with $TESTS_FAILED failed tests${NC}"
    exit 1
else
    echo -e "${GREEN}API testing completed successfully!${NC}"
    exit 0
fi