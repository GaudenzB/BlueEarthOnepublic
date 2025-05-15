#!/bin/bash

# Health Check Script for BlueEarthOne
# 
# This script checks the health of the application's components.
# It has multiple levels of checks: basic, detailed, and deep.
#
# Usage:
#   ./health-check.sh <base_url> [options]
#
# Options:
#   --level <level>       Level of health check: basic (default), detailed, deep
#   --output <format>     Output format: text (default), json
#   --timeout <seconds>   Timeout in seconds for each check (default: 10)
#   --help                Show this help message
#
# Examples:
#   ./health-check.sh https://blueearth.example.com
#   ./health-check.sh https://blueearth.example.com --level detailed --output json
#   ./health-check.sh https://blueearth.example.com --level deep --timeout 30

set -e

# Default values
BASE_URL=""
CHECK_LEVEL="basic"
OUTPUT_FORMAT="text"
TIMEOUT=10
USE_AUTH=false
AUTH_TOKEN=""

# Colors for text output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Health check results
OVERALL_STATUS="pass"
COMPONENTS=()
ERROR_COUNT=0
WARNING_COUNT=0

# Helper function to print usage
function print_usage {
    echo "Health Check Script for BlueEarthOne"
    echo ""
    echo "Usage: $0 <base_url> [options]"
    echo ""
    echo "Options:"
    echo "  --level <level>       Level of health check: basic (default), detailed, deep"
    echo "  --output <format>     Output format: text (default), json"
    echo "  --timeout <seconds>   Timeout in seconds for each check (default: 10)"
    echo "  --auth <token>        Authorization token for authenticated checks"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 https://blueearth.example.com"
    echo "  $0 https://blueearth.example.com --level detailed --output json"
    echo "  $0 https://blueearth.example.com --level deep --timeout 30"
}

# Helper function to add a component check result
function add_component {
    local name="$1"
    local status="$2"
    local message="$3"
    local response_time="$4"
    
    if [ "$status" = "fail" ]; then
        OVERALL_STATUS="fail"
        ERROR_COUNT=$((ERROR_COUNT+1))
    elif [ "$status" = "warn" ]; then
        WARNING_COUNT=$((WARNING_COUNT+1))
        if [ "$OVERALL_STATUS" != "fail" ]; then
            OVERALL_STATUS="warn"
        fi
    fi
    
    COMPONENTS+=("{\"name\":\"$name\",\"status\":\"$status\",\"message\":\"$message\",\"responseTime\":$response_time}")
}

# Helper function to check a URL endpoint
function check_endpoint {
    local name="$1"
    local endpoint="$2"
    local expected_status="$3"
    local description="$4"
    
    local url="${BASE_URL}${endpoint}"
    local start_time=$(date +%s.%N)
    local status_code
    local response_time
    local curl_cmd="curl -s -o /dev/null -w '%{http_code}' -m $TIMEOUT"
    
    # Add auth if provided
    if [ "$USE_AUTH" = true ] && [ -n "$AUTH_TOKEN" ]; then
        curl_cmd="$curl_cmd -H \"Authorization: Bearer $AUTH_TOKEN\""
    fi
    
    # Execute curl command
    status_code=$(eval $curl_cmd \"$url\")
    response_time=$(echo "$(date +%s.%N) - $start_time" | bc)
    
    # Round to 3 decimal places
    response_time=$(printf "%.3f" $response_time)
    
    # Check if status code matches expected
    if [ "$status_code" = "$expected_status" ]; then
        add_component "$name" "pass" "Endpoint is responding correctly (HTTP $status_code)" "$response_time"
    else
        add_component "$name" "fail" "Endpoint returned HTTP $status_code, expected $expected_status" "$response_time"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --level)
            CHECK_LEVEL="$2"
            shift 2
            ;;
        --output)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --auth)
            USE_AUTH=true
            AUTH_TOKEN="$2"
            shift 2
            ;;
        --help)
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

# Validate check level
if [ "$CHECK_LEVEL" != "basic" ] && [ "$CHECK_LEVEL" != "detailed" ] && [ "$CHECK_LEVEL" != "deep" ]; then
    echo -e "${RED}Error: Invalid check level. Valid values are: basic, detailed, deep${NC}"
    exit 1
fi

# Validate output format
if [ "$OUTPUT_FORMAT" != "text" ] && [ "$OUTPUT_FORMAT" != "json" ]; then
    echo -e "${RED}Error: Invalid output format. Valid values are: text, json${NC}"
    exit 1
fi

# Print banner for text output
if [ "$OUTPUT_FORMAT" = "text" ]; then
    echo -e "${BLUE}==============================================${NC}"
    echo -e "${BLUE}  BlueEarthOne Health Check  ${NC}"
    echo -e "${BLUE}==============================================${NC}"
    echo -e "${BLUE}Base URL: ${BASE_URL}${NC}"
    echo -e "${BLUE}Check Level: ${CHECK_LEVEL}${NC}"
    echo -e "${BLUE}==============================================${NC}"
    echo ""
fi

# Run basic health checks
check_endpoint "API" "/api/health" 200 "Basic API health check"
check_endpoint "Frontend" "/" 200 "Frontend serving check"

# Run detailed health checks if requested
if [ "$CHECK_LEVEL" = "detailed" ] || [ "$CHECK_LEVEL" = "deep" ]; then
    check_endpoint "API Detailed" "/api/health/detailed" 200 "Detailed API health check"
    check_endpoint "Auth Status" "/api/auth/status" 200 "Authentication service check"
    check_endpoint "Employee API" "/api/employees?limit=1" 200 "Employee API check"
    check_endpoint "Document API" "/api/documents?limit=1" 200 "Document API check"
fi

# Run deep health checks if requested
if [ "$CHECK_LEVEL" = "deep" ]; then
    check_endpoint "API Deep" "/api/health/deep" 200 "Deep system health check"
    check_endpoint "Database Status" "/api/health/database" 200 "Database connectivity check"
    check_endpoint "Storage Status" "/api/health/storage" 200 "Storage service check"
    check_endpoint "Search Status" "/api/health/search" 200 "Search service check"
fi

# Generate output
if [ "$OUTPUT_FORMAT" = "json" ]; then
    # JSON output format
    echo "{"
    echo "  \"status\": \"$OVERALL_STATUS\","
    echo "  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\","
    echo "  \"baseUrl\": \"$BASE_URL\","
    echo "  \"checkLevel\": \"$CHECK_LEVEL\","
    echo "  \"components\": ["
    
    # Join component results with commas
    COMPONENTS_JSON=$(printf ",%s" "${COMPONENTS[@]}")
    COMPONENTS_JSON=${COMPONENTS_JSON:1}  # Remove leading comma
    echo "$COMPONENTS_JSON"
    
    echo "  ],"
    echo "  \"summary\": {"
    echo "    \"total\": ${#COMPONENTS[@]},"
    echo "    \"pass\": $((${#COMPONENTS[@]} - $ERROR_COUNT - $WARNING_COUNT)),"
    echo "    \"warn\": $WARNING_COUNT,"
    echo "    \"fail\": $ERROR_COUNT"
    echo "  }"
    echo "}"
else
    # Text output format
    echo -e "${BLUE}Health Check Results:${NC}"
    echo ""
    
    # Print each component
    for component in "${COMPONENTS[@]}"; do
        # Extract values from component JSON
        name=$(echo "$component" | jq -r '.name')
        status=$(echo "$component" | jq -r '.status')
        message=$(echo "$component" | jq -r '.message')
        response_time=$(echo "$component" | jq -r '.responseTime')
        
        # Print with appropriate color
        if [ "$status" = "pass" ]; then
            echo -e "${GREEN}✓ $name${NC}: $message ($response_time sec)"
        elif [ "$status" = "warn" ]; then
            echo -e "${YELLOW}⚠ $name${NC}: $message ($response_time sec)"
        else
            echo -e "${RED}✗ $name${NC}: $message ($response_time sec)"
        fi
    done
    
    echo ""
    echo -e "${BLUE}Summary:${NC}"
    echo -e "Total checks: ${#COMPONENTS[@]}"
    echo -e "Passed: $((${#COMPONENTS[@]} - $ERROR_COUNT - $WARNING_COUNT))"
    
    if [ $WARNING_COUNT -gt 0 ]; then
        echo -e "${YELLOW}Warnings: $WARNING_COUNT${NC}"
    else
        echo -e "Warnings: 0"
    fi
    
    if [ $ERROR_COUNT -gt 0 ]; then
        echo -e "${RED}Failed: $ERROR_COUNT${NC}"
    else
        echo -e "Failed: 0"
    fi
    
    echo ""
    
    # Print overall status
    if [ "$OVERALL_STATUS" = "pass" ]; then
        echo -e "${GREEN}Overall Status: HEALTHY${NC}"
        exit 0
    elif [ "$OVERALL_STATUS" = "warn" ]; then
        echo -e "${YELLOW}Overall Status: DEGRADED${NC}"
        exit 0
    else
        echo -e "${RED}Overall Status: UNHEALTHY${NC}"
        exit 1
    fi
fi

# Exit with code based on overall status
if [ "$OVERALL_STATUS" = "pass" ] || [ "$OVERALL_STATUS" = "warn" ]; then
    exit 0
else
    exit 1
fi