#!/bin/bash

# Health Check Script for BlueEarthOne
# 
# This script verifies that a deployed instance is running correctly
# by checking various health endpoints.
#
# Usage:
#   ./health-check.sh <url> [options]
#   
# Options:
#   -d, --detailed    Run detailed health check
#   -f, --full        Run full/deep health check
#   -t, --timeout     Set request timeout in seconds (default: 10)
#   -h, --help        Show help message
#
# Examples:
#   ./health-check.sh https://blueearth.example.com
#   ./health-check.sh https://staging.blueearth.example.com --detailed

set -e

# Default values
URL=""
CHECK_TYPE="basic"
TIMEOUT=10
OUTPUT_JSON=false
RETRY_COUNT=3
RETRY_INTERVAL=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print usage
function print_usage {
    echo "Health Check Script for BlueEarthOne"
    echo ""
    echo "Usage: $0 <url> [options]"
    echo ""
    echo "Options:"
    echo "  -d, --detailed    Run detailed health check"
    echo "  -f, --full        Run full/deep health check"
    echo "  -t, --timeout     Set request timeout in seconds (default: $TIMEOUT)"
    echo "  -j, --json        Output results in JSON format"
    echo "  -r, --retry       Number of retries (default: $RETRY_COUNT)"
    echo "  -i, --interval    Retry interval in seconds (default: $RETRY_INTERVAL)"
    echo "  -h, --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 https://blueearth.example.com"
    echo "  $0 https://staging.blueearth.example.com --detailed"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--detailed)
            CHECK_TYPE="detailed"
            shift
            ;;
        -f|--full)
            CHECK_TYPE="deep"
            shift
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -j|--json)
            OUTPUT_JSON=true
            shift
            ;;
        -r|--retry)
            RETRY_COUNT="$2"
            shift 2
            ;;
        -i|--interval)
            RETRY_INTERVAL="$2"
            shift 2
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        http*://*)
            URL="$1"
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
if [ -z "$URL" ]; then
    echo -e "${RED}Error: URL is required${NC}"
    print_usage
    exit 1
fi

# Build health check URL
if [ "$CHECK_TYPE" == "detailed" ]; then
    HEALTH_URL="${URL}/api/health/detailed"
elif [ "$CHECK_TYPE" == "deep" ]; then
    HEALTH_URL="${URL}/api/health/deep"
else
    HEALTH_URL="${URL}/api/health"
fi

# Remove trailing slash if present
HEALTH_URL=$(echo "$HEALTH_URL" | sed 's/\/$//')

if ! $OUTPUT_JSON; then
    echo -e "${BLUE}Performing ${CHECK_TYPE} health check for: ${URL}${NC}"
    echo -e "${BLUE}Health endpoint: ${HEALTH_URL}${NC}"
    echo -e "${BLUE}Timeout: ${TIMEOUT}s | Retries: ${RETRY_COUNT} | Interval: ${RETRY_INTERVAL}s${NC}"
fi

# Function to make the health check request
function make_request {
    local attempt=$1
    
    if ! $OUTPUT_JSON; then
        echo -e "${YELLOW}Attempt ${attempt}/${RETRY_COUNT}...${NC}"
    fi
    
    # Make the request
    local response=$(curl -s -m "$TIMEOUT" "$HEALTH_URL")
    local status=$?
    
    # Check if curl command was successful
    if [ $status -ne 0 ]; then
        if ! $OUTPUT_JSON; then
            echo -e "${RED}Error: Failed to connect to ${HEALTH_URL} (curl error ${status})${NC}"
        fi
        return 1
    fi
    
    # Check if response is valid JSON
    if ! echo "$response" | jq -e . >/dev/null 2>&1; then
        if ! $OUTPUT_JSON; then
            echo -e "${RED}Error: Invalid JSON response${NC}"
            echo "Raw response:"
            echo "$response"
        fi
        return 1
    fi
    
    # Extract status from response
    local health_status=$(echo "$response" | jq -r '.status')
    
    if [ "$health_status" == "ok" ]; then
        if $OUTPUT_JSON; then
            echo "$response"
        else
            echo -e "${GREEN}Health check passed!${NC}"
            echo "Status: $health_status"
            echo -e "${BLUE}Details:${NC}"
            echo "$response" | jq .
        fi
        return 0
    elif [ "$health_status" == "degraded" ]; then
        if $OUTPUT_JSON; then
            echo "$response"
        else
            echo -e "${YELLOW}Health check degraded!${NC}"
            echo "Status: $health_status"
            echo -e "${BLUE}Details:${NC}"
            echo "$response" | jq .
            
            # Show degraded components
            echo -e "${YELLOW}Degraded components:${NC}"
            echo "$response" | jq '.components | to_entries | .[] | select(.value.status != "ok") | .key + ": " + .value.status'
        fi
        return 2
    else
        if $OUTPUT_JSON; then
            echo "$response"
        else
            echo -e "${RED}Health check failed!${NC}"
            echo "Status: $health_status"
            echo -e "${BLUE}Details:${NC}"
            echo "$response" | jq .
        fi
        return 1
    fi
}

# Retry logic
for ((i=1; i<=RETRY_COUNT; i++)); do
    make_request $i
    result=$?
    
    if [ $result -eq 0 ]; then
        # Health check passed
        exit 0
    elif [ $result -eq 2 ] && [ $i -eq $RETRY_COUNT ]; then
        # Degraded state on final attempt
        if ! $OUTPUT_JSON; then
            echo -e "${YELLOW}System is in a degraded state after ${RETRY_COUNT} attempts.${NC}"
        fi
        exit 2
    elif [ $i -lt $RETRY_COUNT ]; then
        # Retry after interval
        if ! $OUTPUT_JSON; then
            echo -e "${YELLOW}Retrying in ${RETRY_INTERVAL} seconds...${NC}"
        fi
        sleep $RETRY_INTERVAL
    fi
done

# All retries failed
if ! $OUTPUT_JSON; then
    echo -e "${RED}Health check failed after ${RETRY_COUNT} attempts.${NC}"
fi
exit 1