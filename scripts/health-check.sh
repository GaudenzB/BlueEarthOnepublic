#!/bin/bash
# Health Check Script
# Verifies the application is running correctly after deployment

# Configuration
DEFAULT_URL="http://localhost:3000/api/health/deep"
HEALTH_CHECK_URL=${1:-$DEFAULT_URL}
RETRIES=${2:-5}
WAIT_TIME=${3:-10}
TIMEOUT=${4:-5}

# Log messages with timestamps
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to perform the health check
perform_health_check() {
  log "Performing health check on $HEALTH_CHECK_URL"
  
  # Use curl with timeout to prevent hanging
  response=$(curl -s -m $TIMEOUT $HEALTH_CHECK_URL)
  status=$?
  
  # Check if curl command was successful
  if [ $status -ne 0 ]; then
    log "ERROR: Health check request failed with exit code $status"
    return 1
  fi
  
  # Check if we received a valid JSON response
  if ! echo "$response" | jq . > /dev/null 2>&1; then
    log "ERROR: Invalid JSON response received"
    log "Response: $response"
    return 1
  fi
  
  # Extract the status from the response
  health_status=$(echo "$response" | jq -r '.status')
  
  if [ "$health_status" = "UP" ]; then
    log "Health check passed: System status is UP"
    
    # Log additional component status information if available
    if echo "$response" | jq -e '.components' > /dev/null 2>&1; then
      db_status=$(echo "$response" | jq -r '.components.database.status')
      log "Database status: $db_status"
      
      if echo "$response" | jq -e '.components.storage' > /dev/null 2>&1; then
        storage_status=$(echo "$response" | jq -r '.components.storage.status')
        log "Storage status: $storage_status"
      fi
    fi
    
    return 0
  elif [ "$health_status" = "DEGRADED" ]; then
    log "WARNING: System is in DEGRADED state"
    
    # Log detailed information about degraded components
    if echo "$response" | jq -e '.components' > /dev/null 2>&1; then
      echo "$response" | jq -r '.components | to_entries[] | select(.value.status != "UP") | "  - " + .key + ": " + .value.status + " - " + (.value.details // "No details")'
    fi
    
    # In CI/CD pipeline, we might want to accept DEGRADED as successful depending on which component is degraded
    # For now, we'll treat it as a failure
    return 1
  else
    log "ERROR: System health check failed with status: $health_status"
    
    # Log detailed error information if available
    if echo "$response" | jq -e '.components' > /dev/null 2>&1; then
      echo "$response" | jq -r '.components | to_entries[] | select(.value.status != "UP") | "  - " + .key + ": " + .value.status + " - " + (.value.details // "No details")'
    fi
    
    return 1
  fi
}

# Main health check loop with retries
attempt=1
while [ $attempt -le $RETRIES ]; do
  log "Health check attempt $attempt of $RETRIES"
  
  if perform_health_check; then
    log "Health check successful! Application is ready."
    exit 0
  fi
  
  if [ $attempt -lt $RETRIES ]; then
    log "Waiting ${WAIT_TIME}s before next attempt..."
    sleep $WAIT_TIME
  fi
  
  attempt=$((attempt + 1))
done

log "ERROR: Health check failed after $RETRIES attempts. Application may not be functioning correctly."
exit 1