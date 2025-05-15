#!/bin/bash
# Health check script for deployment verification

# Default values
API_URL=${1:-"http://localhost:5000"}
MAX_RETRIES=${2:-30}
RETRY_INTERVAL=${3:-2}

# Print usage information
function usage() {
  echo "Usage: $0 [API_URL] [MAX_RETRIES] [RETRY_INTERVAL]"
  echo "  API_URL: Base URL of the API to check (default: http://localhost:5000)"
  echo "  MAX_RETRIES: Maximum number of health check retries (default: 30)"
  echo "  RETRY_INTERVAL: Seconds between retries (default: 2)"
  exit 1
}

# Print header
echo "Running health checks against $API_URL"
echo "Maximum retries: $MAX_RETRIES, Retry interval: $RETRY_INTERVAL seconds"
echo "------------------------------------------------------"

# Array of endpoints to check
ENDPOINTS=(
  "/"                # Root endpoint should return 200
  "/api/health"      # Dedicated health endpoint
  "/api/auth/me"     # Auth endpoint (should return 401 if not authenticated)
)

# Array of health check functions
function check_root_endpoint() {
  local status_code=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL})
  if [[ $status_code -eq 200 ]]; then
    echo "✅ Root endpoint is accessible"
    return 0
  else
    echo "❌ Root endpoint returned status code $status_code"
    return 1
  fi
}

function check_health_endpoint() {
  local response=$(curl -s ${API_URL}/api/health)
  local status_code=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/api/health)
  
  if [[ $status_code -eq 200 ]] && [[ $response == *"status"* ]] && [[ $response == *"ok"* ]]; then
    echo "✅ Health endpoint is reporting system healthy"
    return 0
  else
    echo "❌ Health endpoint check failed: $response (status code: $status_code)"
    return 1
  fi
}

function check_auth_endpoint() {
  local status_code=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/api/auth/me)
  
  # We expect a 401 Unauthorized since we're not authenticated
  if [[ $status_code -eq 401 ]]; then
    echo "✅ Auth endpoint is working correctly (returned 401 as expected)"
    return 0
  else
    echo "❌ Auth endpoint check failed with status code $status_code"
    return 1
  fi
}

# Main health check function
function run_health_checks() {
  echo "Starting health checks..."
  
  local all_passed=true
  
  # Run all health check functions
  check_root_endpoint || all_passed=false
  check_health_endpoint || all_passed=false
  check_auth_endpoint || all_passed=false
  
  if $all_passed; then
    echo "------------------------------------------------------"
    echo "✅ All health checks passed!"
    return 0
  else
    echo "------------------------------------------------------"
    echo "❌ Some health checks failed!"
    return 1
  fi
}

# Run health checks with retries
retry_count=0
while [ $retry_count -lt $MAX_RETRIES ]; do
  echo "Attempt $((retry_count+1))/$MAX_RETRIES:"
  
  if run_health_checks; then
    exit 0
  fi
  
  retry_count=$((retry_count+1))
  
  if [ $retry_count -lt $MAX_RETRIES ]; then
    echo "Retrying in $RETRY_INTERVAL seconds..."
    sleep $RETRY_INTERVAL
  fi
done

echo "Health checks failed after $MAX_RETRIES attempts!"
exit 1