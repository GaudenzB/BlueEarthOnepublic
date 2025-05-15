#!/bin/bash

# Rollback Script for BlueEarthOne Deployments
# 
# This script handles the rollback of failed deployments:
# 1. Reverts code to the previous version
# 2. Restores database to a known good state (if requested)
# 3. Restarts application services
#
# Usage: 
#   ./rollback.sh                 # Standard rollback to the latest backup
#   ./rollback.sh -d              # Rollback with database restore
#   ./rollback.sh -b <backup_id>  # Rollback to a specific backup ID
#   ./rollback.sh -h              # Display help information

set -e

# Configuration
APP_DIR="/var/www/blueearth"
BACKUP_DIR="/var/www/backups"
LATEST_BACKUP_LINK="$BACKUP_DIR/latest"
LOG_FILE="/var/log/deployment/rollback.log"

# Initialize variables
RESTORE_DB=false
SPECIFIC_BACKUP=""

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Log function
log() {
    local level="$1"
    local message="$2"
    local timestamp
    timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Usage help function
show_help() {
    echo "Rollback Script for BlueEarthOne Deployments"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -d            Restore database from backup"
    echo "  -b <backup>   Rollback to a specific backup ID (timestamp)"
    echo "  -h            Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0            # Standard rollback to the latest backup"
    echo "  $0 -d         # Rollback with database restore"
    echo "  $0 -b 20250515123045  # Rollback to specific backup"
}

# Parse command-line arguments
while getopts ":db:h" opt; do
    case $opt in
        d)
            RESTORE_DB=true
            ;;
        b)
            SPECIFIC_BACKUP="$OPTARG"
            ;;
        h)
            show_help
            exit 0
            ;;
        \?)
            log "ERROR" "Invalid option: -$OPTARG"
            show_help
            exit 1
            ;;
    esac
done

log "INFO" "Starting rollback process"

# Determine which backup to use
if [ -n "$SPECIFIC_BACKUP" ]; then
    BACKUP_PATH="$BACKUP_DIR/$SPECIFIC_BACKUP"
    if [ ! -d "$BACKUP_PATH" ]; then
        log "ERROR" "Specified backup '$SPECIFIC_BACKUP' does not exist"
        exit 1
    fi
    log "INFO" "Using specified backup: $SPECIFIC_BACKUP"
else
    if [ ! -L "$LATEST_BACKUP_LINK" ]; then
        log "ERROR" "No latest backup link found at $LATEST_BACKUP_LINK"
        exit 1
    fi
    BACKUP_PATH=$(readlink -f "$LATEST_BACKUP_LINK")
    BACKUP_ID=$(basename "$BACKUP_PATH")
    log "INFO" "Using latest backup: $BACKUP_ID"
fi

# Check that the backup exists and is valid
if [ ! -d "$BACKUP_PATH" ]; then
    log "ERROR" "Backup directory does not exist: $BACKUP_PATH"
    exit 1
fi

if [ ! -f "$BACKUP_PATH/package.json" ]; then
    log "ERROR" "Backup appears invalid, missing package.json: $BACKUP_PATH"
    exit 1
fi

log "INFO" "Stopping application service"
if command -v pm2 &> /dev/null; then
    pm2 stop blueearth || log "WARN" "Failed to stop PM2 service, may not be running"
else
    log "WARN" "PM2 not found, unable to stop service through PM2"
    # Fallback to systemd if PM2 is not available
    if command -v systemctl &> /dev/null && systemctl is-active --quiet blueearth.service; then
        systemctl stop blueearth.service || log "WARN" "Failed to stop systemd service"
    fi
fi

# Create a backup of the current state before rolling back (for potential recovery)
ROLLBACK_TIMESTAMP=$(date +"%Y%m%d%H%M%S")
ROLLBACK_BACKUP_DIR="$BACKUP_DIR/pre_rollback_$ROLLBACK_TIMESTAMP"
log "INFO" "Creating backup of current state: $ROLLBACK_BACKUP_DIR"
mkdir -p "$ROLLBACK_BACKUP_DIR"
cp -r "$APP_DIR"/* "$ROLLBACK_BACKUP_DIR/" || log "WARN" "Failed to backup current state, continuing with rollback"

# Restore code from backup
log "INFO" "Restoring code from backup: $BACKUP_PATH"
rm -rf "$APP_DIR"/*
cp -r "$BACKUP_PATH"/* "$APP_DIR/"

# Restore database if requested
if [ "$RESTORE_DB" = true ]; then
    DB_BACKUP="$BACKUP_PATH/db-backup.sql"
    if [ -f "$DB_BACKUP" ]; then
        log "INFO" "Restoring database from backup"
        # Get database details from env file or use defaults
        if [ -f "$APP_DIR/.env" ]; then
            source "$APP_DIR/.env"
        fi
        
        DB_NAME=${PGDATABASE:-"blueearth"}
        DB_USER=${PGUSER:-"postgres"}
        DB_HOST=${PGHOST:-"localhost"}
        
        log "INFO" "Running database restoration: $DB_NAME on $DB_HOST as $DB_USER"
        
        if ! PGPASSWORD="$PGPASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -d "$DB_NAME" -f "$DB_BACKUP"; then
            log "ERROR" "Database restore failed"
            log "INFO" "Continuing with rollback anyway, database may be in an inconsistent state"
        else
            log "INFO" "Database successfully restored from backup"
        fi
    else
        log "WARN" "No database backup found at $DB_BACKUP, skipping database restore"
    fi
fi

# Install dependencies (using production flag for efficiency)
log "INFO" "Installing dependencies"
cd "$APP_DIR" || { log "ERROR" "Failed to change to application directory"; exit 1; }
if ! npm ci --production; then
    log "ERROR" "Failed to install dependencies"
    log "INFO" "Attempting to continue rollback despite dependency installation failure"
fi

# Restart the application
log "INFO" "Restarting application service"
if command -v pm2 &> /dev/null; then
    pm2 restart blueearth || pm2 start dist/server/index.js --name blueearth
else
    # Fallback to systemd if PM2 is not available
    if command -v systemctl &> /dev/null; then
        systemctl start blueearth.service || log "ERROR" "Failed to start systemd service"
    else
        log "ERROR" "Unable to restart application service, no PM2 or systemd available"
    fi
fi

# Verify application started successfully
log "INFO" "Verifying application health"
sleep 5 # Give the application time to start up

# Health check against the API
MAX_RETRIES=5
RETRY_COUNT=0
HEALTH_URL="http://localhost:3000/api/health"

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    log "INFO" "Health check attempt $((RETRY_COUNT+1))/$MAX_RETRIES"
    
    if curl -s "$HEALTH_URL" | grep -q '"status":"ok"'; then
        log "INFO" "Health check passed, rollback completed successfully"
        exit 0
    else
        log "WARN" "Health check failed, retrying in 5 seconds..."
        RETRY_COUNT=$((RETRY_COUNT+1))
        sleep 5
    fi
done

log "ERROR" "Health check failed after $MAX_RETRIES attempts, rollback may not be complete"
log "ERROR" "Manual intervention may be required"
exit 1