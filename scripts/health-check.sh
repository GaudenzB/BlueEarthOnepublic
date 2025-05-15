#!/bin/bash

# BlueEarthOne Health Check Script
# Usage: ./health-check.sh <base_url> [--level basic|detailed|deep] [--output text|json]

# Default values
LEVEL="basic"
OUTPUT_FORMAT="text"
BASE_URL=""

# Process command-line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --level)
      LEVEL="$2"
      shift 2
      ;;
    --output)
      OUTPUT_FORMAT="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 <base_url> [--level basic|detailed|deep] [--output text|json]"
      echo
      echo "Options:"
      echo "  --level LEVEL      Health check level (basic, detailed, deep). Default: basic"
      echo "  --output FORMAT    Output format (text, json). Default: text"
      echo "  --help             Show this help message"
      exit 0
      ;;
    *)
      BASE_URL="$1"
      shift
      ;;
  esac
done

# Validate base URL
if [[ -z "$BASE_URL" ]]; then
  echo "Error: Base URL is required."
  echo "Usage: $0 <base_url> [--level basic|detailed|deep] [--output text|json]"
  exit 1
fi

# Validate level option
if [[ "$LEVEL" != "basic" && "$LEVEL" != "detailed" && "$LEVEL" != "deep" ]]; then
  echo "Error: Invalid level. Must be one of: basic, detailed, deep."
  exit 1
fi

# Validate output format
if [[ "$OUTPUT_FORMAT" != "text" && "$OUTPUT_FORMAT" != "json" ]]; then
  echo "Error: Invalid output format. Must be one of: text, json."
  exit 1
fi

# Initialize results
declare -A results
status="pass"
started_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Function to perform HTTP request with timeout
function do_request() {
  local url=$1
  local timeout=${2:-5}
  local start_time=$(date +%s.%N)
  local response=$(curl -s -o /dev/null -w "%{http_code}" -m "$timeout" "$url" 2>/dev/null)
  local end_time=$(date +%s.%N)
  local resp_time=$(echo "$end_time - $start_time" | bc)
  
  echo "$response|$resp_time"
}

# Basic health check - just verify the service is up
function basic_health_check() {
  local health_url="${BASE_URL}/api/health"
  local result=$(do_request "$health_url" 5)
  local http_code=$(echo "$result" | cut -d'|' -f1)
  local resp_time=$(echo "$result" | cut -d'|' -f2)
  
  if [[ "$http_code" -eq 200 ]]; then
    results["api"]="pass|API endpoint is responding correctly|$resp_time"
  else
    results["api"]="fail|API endpoint is not responding properly (HTTP $http_code)|$resp_time"
    status="fail"
  fi
}

# Detailed health check - validate API endpoints and basic functionality
function detailed_health_check() {
  # Run basic checks first
  basic_health_check
  
  # Additional checks
  
  # Auth endpoint check
  local auth_url="${BASE_URL}/api/auth/status"
  local result=$(do_request "$auth_url" 5)
  local http_code=$(echo "$result" | cut -d'|' -f1)
  local resp_time=$(echo "$result" | cut -d'|' -f2)
  
  if [[ "$http_code" -eq 200 || "$http_code" -eq 401 ]]; then
    results["auth"]="pass|Auth endpoint is responding correctly|$resp_time"
  else
    results["auth"]="fail|Auth endpoint is not responding properly (HTTP $http_code)|$resp_time"
    status="fail"
  fi
  
  # Employees endpoint check
  local employees_url="${BASE_URL}/api/employees"
  local result=$(do_request "$employees_url" 5)
  local http_code=$(echo "$result" | cut -d'|' -f1)
  local resp_time=$(echo "$result" | cut -d'|' -f2)
  
  if [[ "$http_code" -eq 200 || "$http_code" -eq 401 ]]; then
    results["employees"]="pass|Employees endpoint is responding correctly|$resp_time"
  else
    results["employees"]="fail|Employees endpoint is not responding properly (HTTP $http_code)|$resp_time"
    status="fail"
  fi
  
  # Documents endpoint check
  local documents_url="${BASE_URL}/api/documents"
  local result=$(do_request "$documents_url" 5)
  local http_code=$(echo "$result" | cut -d'|' -f1)
  local resp_time=$(echo "$result" | cut -d'|' -f2)
  
  if [[ "$http_code" -eq 200 || "$http_code" -eq 401 ]]; then
    results["documents"]="pass|Documents endpoint is responding correctly|$resp_time"
  else
    results["documents"]="fail|Documents endpoint is not responding properly (HTTP $http_code)|$resp_time"
    status="fail"
  fi
}

# Deep health check - validate database, storage, and external services
function deep_health_check() {
  # Run detailed checks first
  detailed_health_check
  
  # Database health check
  local db_url="${BASE_URL}/api/health/database"
  local result=$(do_request "$db_url" 8)
  local http_code=$(echo "$result" | cut -d'|' -f1)
  local resp_time=$(echo "$result" | cut -d'|' -f2)
  
  if [[ "$http_code" -eq 200 ]]; then
    results["database"]="pass|Database connection is healthy|$resp_time"
  else
    results["database"]="fail|Database connection check failed (HTTP $http_code)|$resp_time"
    status="fail"
  fi
  
  # Storage health check
  local storage_url="${BASE_URL}/api/health/storage"
  local result=$(do_request "$storage_url" 10)
  local http_code=$(echo "$result" | cut -d'|' -f1)
  local resp_time=$(echo "$result" | cut -d'|' -f2)
  
  if [[ "$http_code" -eq 200 ]]; then
    results["storage"]="pass|Storage system is functioning properly|$resp_time"
  else
    results["storage"]="fail|Storage system check failed (HTTP $http_code)|$resp_time"
    status="fail"
  fi
  
  # Entra ID / SSO health check (if configured)
  local sso_url="${BASE_URL}/api/health/sso"
  local result=$(do_request "$sso_url" 10)
  local http_code=$(echo "$result" | cut -d'|' -f1)
  local resp_time=$(echo "$result" | cut -d'|' -f2)
  
  if [[ "$http_code" -eq 200 ]]; then
    results["sso"]="pass|SSO integration is functioning properly|$resp_time"
  elif [[ "$http_code" -eq 204 ]]; then
    results["sso"]="warn|SSO integration is not configured|$resp_time"
  else
    results["sso"]="fail|SSO integration check failed (HTTP $http_code)|$resp_time"
    
    # Only fail the entire check if SSO is required (which is signaled by a 500 response)
    if [[ "$http_code" -eq 500 ]]; then
      status="fail"
    fi
  fi
}

# Run health check based on specified level
case "$LEVEL" in
  "basic")
    basic_health_check
    ;;
  "detailed")
    detailed_health_check
    ;;
  "deep")
    deep_health_check
    ;;
esac

completed_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Output results based on specified format
if [[ "$OUTPUT_FORMAT" == "json" ]]; then
  # Start JSON output
  echo "{"
  echo "  \"status\": \"$status\","
  echo "  \"version\": \"1.0.0\","
  echo "  \"timestamp\": \"$completed_at\","
  echo "  \"duration\": \"$(date -u -d "@$(( $(date -d "$completed_at" +%s) - $(date -d "$started_at" +%s) ))" +"%H:%M:%S")\","
  echo "  \"checks\": {"
  
  # Process each result
  first=true
  for key in "${!results[@]}"; do
    if [[ "$first" == "true" ]]; then
      first=false
    else
      echo ","
    fi
    
    result_status=$(echo "${results[$key]}" | cut -d'|' -f1)
    result_message=$(echo "${results[$key]}" | cut -d'|' -f2)
    result_time=$(echo "${results[$key]}" | cut -d'|' -f3)
    
    echo -n "    \"$key\": {"
    echo -n "\"status\": \"$result_status\", "
    echo -n "\"message\": \"$result_message\", "
    echo -n "\"responseTime\": $result_time"
    echo -n "}"
  done
  
  # Close JSON structure
  echo ""
  echo "  }"
  echo "}"
else
  # Text output
  echo "BlueEarthOne Health Check Report"
  echo "================================"
  echo "Status: $status"
  echo "Time: $completed_at"
  echo "Level: $LEVEL"
  echo ""
  echo "Results:"
  
  for key in "${!results[@]}"; do
    result_status=$(echo "${results[$key]}" | cut -d'|' -f1)
    result_message=$(echo "${results[$key]}" | cut -d'|' -f2)
    result_time=$(echo "${results[$key]}" | cut -d'|' -f3)
    
    # Format output
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
    
    printf "  %s[%s]%s %s (%.2fs)\n" "$status_color" "$result_status" "$reset_color" "$result_message" "$result_time"
  done
fi

# Return appropriate exit code
if [[ "$status" == "fail" ]]; then
  exit 1
else
  exit 0
fi