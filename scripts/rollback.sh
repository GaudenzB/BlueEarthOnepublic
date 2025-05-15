#!/bin/bash
# Rollback Script for Failed Deployments
# This script restores the previous version of the application in case of deployment failure

# Exit on any error
set -e

# Configuration variables
DEPLOYMENT_DIR="/var/www/blueearth"
BACKUP_DIR="/var/www/backups"
LOG_FILE="/var/log/deployment/rollback.log"
CURRENT_TAG=$(cat $DEPLOYMENT_DIR/CURRENT_VERSION 2>/dev/null || echo "unknown")

# Create log directory if it doesn't exist
mkdir -p $(dirname $LOG_FILE)

# Log function
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Check if we have a backup to restore
if [ ! -d "$BACKUP_DIR/latest" ]; then
  log "ERROR: No backup found at $BACKUP_DIR/latest. Cannot rollback."
  exit 1
fi

# Begin rollback
log "Starting rollback from version $CURRENT_TAG to previous version"

# Check environment specific rollback needs
if [ -f "$BACKUP_DIR/latest/pre-rollback.sh" ]; then
  log "Executing pre-rollback script..."
  bash "$BACKUP_DIR/latest/pre-rollback.sh" || log "WARNING: Pre-rollback script failed, continuing anyway"
fi

# Restore application files
log "Restoring application files..."
rsync -a --delete $BACKUP_DIR/latest/app/ $DEPLOYMENT_DIR/

# Restore database if backup exists
if [ -f "$BACKUP_DIR/latest/db-backup.sql" ]; then
  log "Restoring database from backup..."
  export PGPASSWORD=${PGPASSWORD:-$DB_PASSWORD}
  psql -h ${DB_HOST:-localhost} -U ${DB_USER:-postgres} -d ${DB_NAME:-blueearth} -f "$BACKUP_DIR/latest/db-backup.sql" || {
    log "ERROR: Database restore failed. Application may be in an inconsistent state."
    exit 1
  }
fi

# Execute post-rollback script if it exists
if [ -f "$BACKUP_DIR/latest/post-rollback.sh" ]; then
  log "Executing post-rollback script..."
  bash "$BACKUP_DIR/latest/post-rollback.sh" || log "WARNING: Post-rollback script failed"
fi

# Restart services
log "Restarting application services..."
if [ -f "$DEPLOYMENT_DIR/restart.sh" ]; then
  bash "$DEPLOYMENT_DIR/restart.sh"
else
  # Default restart commands
  systemctl restart blueearth-api || log "WARNING: Failed to restart API service"
  systemctl restart nginx || log "WARNING: Failed to restart web server"
fi

# Check application health
log "Performing health check..."
HEALTH_CHECK_URL=${HEALTH_CHECK_URL:-"http://localhost:3000/api/health"}
RETRY_COUNT=0
MAX_RETRIES=5

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_CHECK_URL || echo "000")
  
  if [ "$HEALTH_STATUS" = "200" ]; then
    log "Health check passed. Rollback successful."
    echo "ROLLBACK_SUCCESS=true" > $DEPLOYMENT_DIR/rollback_status
    
    # Send notification about successful rollback if configured
    if [ ! -z "$NOTIFICATION_WEBHOOK" ]; then
      curl -s -X POST -H "Content-Type: application/json" \
        -d "{\"text\":\"⚠️ Deployment rollback successful. Reverted to previous stable version.\"}" \
        $NOTIFICATION_WEBHOOK
    fi
    
    exit 0
  fi
  
  log "Health check failed with status $HEALTH_STATUS. Retrying ($((RETRY_COUNT+1))/$MAX_RETRIES)..."
  RETRY_COUNT=$((RETRY_COUNT+1))
  sleep 10
done

log "ERROR: Health check failed after $MAX_RETRIES attempts. Manual intervention required."
echo "ROLLBACK_SUCCESS=false" > $DEPLOYMENT_DIR/rollback_status

# Send notification about failed rollback if configured
if [ ! -z "$NOTIFICATION_WEBHOOK" ]; then
  curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"text\":\"🚨 URGENT: Deployment rollback FAILED. System may be down. Manual intervention required.\"}" \
    $NOTIFICATION_WEBHOOK
fi

exit 1