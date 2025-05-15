#!/bin/bash

# BlueEarthOne Rollback Script
# Usage: ./rollback.sh [--version VERSION] [--backup BACKUP_FILE] [--env ENVIRONMENT] [--force]

# Default values
VERSION=""
BACKUP_FILE=""
ENVIRONMENT="staging"
FORCE=false
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_DIR="./backups"

# Process command-line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --version)
      VERSION="$2"
      shift 2
      ;;
    --backup)
      BACKUP_FILE="$2"
      shift 2
      ;;
    --env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --help)
      echo "Usage: $0 [--version VERSION] [--backup BACKUP_FILE] [--env ENVIRONMENT] [--force]"
      echo
      echo "Options:"
      echo "  --version VERSION    Specific version to rollback to (git tag or commit hash)"
      echo "  --backup BACKUP_FILE Database backup file to restore"
      echo "  --env ENVIRONMENT    Target environment (staging, production). Default: staging"
      echo "  --force              Skip confirmation prompt"
      echo "  --help               Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run '$0 --help' for usage information."
      exit 1
      ;;
  esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
  echo "Error: Invalid environment. Must be one of: staging, production."
  exit 1
fi

# Load environment-specific configuration
if [[ "$ENVIRONMENT" == "production" ]]; then
  DB_URL="${PRODUCTION_DATABASE_URL:-}"
  APP_URL="https://app.blueearth.example.com"
  SERVICE_NAME="blueearth-app-prod"
else
  DB_URL="${STAGING_DATABASE_URL:-}"
  APP_URL="https://staging.blueearth.example.com"
  SERVICE_NAME="blueearth-app-staging"
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to create a backup of the current state
function create_backup() {
  echo "Creating backup of current database state..."
  
  # Exit if pg_dump is not available
  if ! command -v pg_dump &> /dev/null; then
    echo "Error: pg_dump command not found. Cannot create backup."
    return 1
  fi
  
  # Create backup filename
  local backup_file="${BACKUP_DIR}/backup-${ENVIRONMENT}-${TIMESTAMP}.sql"
  
  # Perform backup
  if [[ -n "$DB_URL" ]]; then
    if pg_dump "$DB_URL" > "$backup_file"; then
      echo "Backup created successfully: $backup_file"
      return 0
    else
      echo "Error: Failed to create backup."
      return 1
    fi
  else
    echo "Error: Database URL not set. Cannot create backup."
    return 1
  fi
}

# Function to restore a database backup
function restore_backup() {
  local backup_file="$1"
  
  echo "Restoring database from backup: $backup_file"
  
  # Exit if psql is not available
  if ! command -v psql &> /dev/null; then
    echo "Error: psql command not found. Cannot restore backup."
    return 1
  fi
  
  # Check if backup file exists
  if [[ ! -f "$backup_file" ]]; then
    echo "Error: Backup file not found: $backup_file"
    return 1
  fi
  
  # Perform restore
  if [[ -n "$DB_URL" ]]; then
    # First, drop all tables to avoid conflicts
    echo "Dropping existing tables..."
    psql "$DB_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    
    if psql "$DB_URL" < "$backup_file"; then
      echo "Database restored successfully from: $backup_file"
      return 0
    else
      echo "Error: Failed to restore database from backup."
      return 1
    fi
  else
    echo "Error: Database URL not set. Cannot restore backup."
    return 1
  fi
}

# Function to find the latest backup file
function find_latest_backup() {
  local pattern="${BACKUP_DIR}/backup-${ENVIRONMENT}-*.sql"
  local latest_backup=$(ls -t $pattern 2>/dev/null | head -n 1)
  
  if [[ -n "$latest_backup" && -f "$latest_backup" ]]; then
    echo "$latest_backup"
    return 0
  else
    echo ""
    return 1
  fi
}

# Function to roll back code to a specific version
function rollback_code() {
  local target_version="$1"
  
  echo "Rolling back code to version: $target_version"
  
  # Stash any changes
  git stash -m "Automatic stash before rollback" || true
  
  # Fetch latest from remote
  git fetch --all
  
  # Check if version exists
  if git rev-parse --verify "$target_version" >/dev/null 2>&1; then
    # Checkout the specified version
    if git checkout "$target_version"; then
      echo "Code rolled back successfully to: $target_version"
      return 0
    else
      echo "Error: Failed to checkout version: $target_version"
      return 1
    fi
  else
    echo "Error: Version not found: $target_version"
    return 1
  fi
}

# Function to restart services
function restart_services() {
  echo "Restarting services..."
  
  # This is a placeholder that should be replaced with actual service restart commands
  # For example, this might use AWS CLI, systemctl, or other service management tools
  
  echo "Rebuilding application..."
  npm run build
  
  echo "Restarting application service..."
  # Example: systemctl restart $SERVICE_NAME
  # or: aws ecs update-service --force-new-deployment --service $SERVICE_NAME
  
  echo "Services restarted."
}

# Function to verify rollback success
function verify_rollback() {
  echo "Verifying rollback..."
  
  # Wait for services to fully start
  echo "Waiting for services to start..."
  sleep 10
  
  # Perform health check
  echo "Performing health check..."
  if ./scripts/health-check.sh "$APP_URL" --level detailed --output text; then
    echo "Health check passed. Rollback successful."
    return 0
  else
    echo "Warning: Health check failed after rollback."
    return 1
  fi
}

# Main rollback procedure
echo "======================================="
echo "BlueEarthOne Rollback - $ENVIRONMENT"
echo "======================================="

# Confirm rollback unless --force is specified
if [[ "$FORCE" != "true" ]]; then
  read -p "Are you sure you want to proceed with rollback? [y/N] " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Rollback cancelled."
    exit 0
  fi
fi

# Create backup of current state
create_backup

# Handle database rollback
if [[ -n "$BACKUP_FILE" ]]; then
  # Use specified backup file
  if ! restore_backup "$BACKUP_FILE"; then
    echo "Error: Database rollback failed."
    exit 1
  fi
elif [[ -z "$VERSION" ]]; then
  # If no version is specified and no backup file, use latest backup
  latest_backup=$(find_latest_backup)
  if [[ -n "$latest_backup" ]]; then
    echo "No backup file specified. Using latest backup: $latest_backup"
    if ! restore_backup "$latest_backup"; then
      echo "Error: Database rollback failed."
      exit 1
    fi
  else
    echo "Warning: No backup file specified and no recent backups found."
    
    # Only proceed with code rollback if desired
    if [[ "$FORCE" != "true" ]]; then
      read -p "Continue with code rollback only? [y/N] " confirm
      if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        echo "Rollback cancelled."
        exit 0
      fi
    fi
  fi
fi

# Handle code rollback
if [[ -n "$VERSION" ]]; then
  if ! rollback_code "$VERSION"; then
    echo "Error: Code rollback failed."
    exit 1
  fi
elif [[ -z "$BACKUP_FILE" ]]; then
  # If neither version nor backup file specified, use previous release
  echo "No version specified. Rolling back to previous release..."
  
  # Get list of tags in reverse chronological order
  tags=$(git tag --sort=-creatordate)
  
  if [[ -n "$tags" ]]; then
    # Get current tag or commit
    current_version=$(git describe --tags --always)
    
    # Find the previous tag
    previous_tag=""
    for tag in $tags; do
      if [[ "$tag" != "$current_version" ]]; then
        previous_tag=$tag
        break
      fi
    done
    
    if [[ -n "$previous_tag" ]]; then
      echo "Rolling back to previous release: $previous_tag"
      if ! rollback_code "$previous_tag"; then
        echo "Error: Code rollback failed."
        exit 1
      fi
    else
      echo "Error: Could not determine previous release."
      exit 1
    fi
  else
    echo "Error: No tags found in the repository."
    exit 1
  fi
fi

# Restart services
restart_services

# Verify rollback success
if verify_rollback; then
  echo "======================================="
  echo "Rollback completed successfully!"
  echo "Environment: $ENVIRONMENT"
  if [[ -n "$VERSION" ]]; then
    echo "Code version: $VERSION"
  fi
  if [[ -n "$BACKUP_FILE" ]]; then
    echo "Database restored from: $BACKUP_FILE"
  fi
  echo "======================================="
  exit 0
else
  echo "======================================="
  echo "Warning: Rollback completed, but verification failed."
  echo "Please check system status manually."
  echo "======================================="
  exit 1
fi