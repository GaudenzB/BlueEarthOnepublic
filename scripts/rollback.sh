#!/bin/bash

# BlueEarthOne Database Rollback Script
# This script supports rolling back the database to a previous state
# by restoring from backups.

# Set default variables
BACKUP_DIR="./backups"
ENVIRONMENT=${1:-"development"}
BACKUP_FILE=${2:-""}
DATABASE_URL=${DATABASE_URL:-""}
CONFIRM=${3:-""}

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print usage
function printUsage() {
  echo "Usage: $0 [environment] [backup_file] [confirm]"
  echo ""
  echo "Arguments:"
  echo "  environment    The environment to rollback (development, staging, production)"
  echo "  backup_file    (Optional) Specific backup file to restore"
  echo "  confirm        Pass 'yes' to bypass confirmation prompts (for automated scripts)"
  echo ""
  echo "Examples:"
  echo "  $0 development                   # Lists available backups for development"
  echo "  $0 production backup_20250515.sql  # Restores specific backup to production"
  echo "  $0 staging latest yes            # Restores latest staging backup without confirmation"
  echo ""
}

# Function to check if PostgreSQL tools are available
function checkPgTools() {
  if ! command -v pg_dump &> /dev/null || ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL client tools (pg_dump, psql) are not installed${NC}"
    echo "Please install the PostgreSQL client tools and try again."
    exit 1
  fi
}

# Function to check database connection
function checkDatabaseConnection() {
  if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
    echo "Please set the DATABASE_URL environment variable and try again."
    exit 1
  fi
  
  # Test connection
  if ! psql "$DATABASE_URL" -c '\q' 2>/dev/null; then
    echo -e "${RED}Error: Could not connect to database${NC}"
    echo "Please check your database credentials and try again."
    exit 1
  fi
}

# Function to create a backup of the current database state
function createBackup() {
  local timestamp=$(date +"%Y%m%d_%H%M%S")
  local backup_file="${BACKUP_DIR}/${ENVIRONMENT}_backup_${timestamp}.sql"
  
  echo -e "${YELLOW}Creating backup of current database state...${NC}"
  
  # Create backup directory if it doesn't exist
  mkdir -p "$BACKUP_DIR"
  
  # Dump database to backup file
  if pg_dump "$DATABASE_URL" > "$backup_file"; then
    echo -e "${GREEN}Backup created successfully: ${backup_file}${NC}"
    echo "$backup_file"
  else
    echo -e "${RED}Error: Failed to create backup${NC}"
    exit 1
  fi
}

# Function to list available backups
function listBackups() {
  # Create backup directory if it doesn't exist
  mkdir -p "$BACKUP_DIR"
  
  echo -e "${YELLOW}Available backups for ${ENVIRONMENT} environment:${NC}"
  
  # List backups for the specified environment
  local backups=$(find "$BACKUP_DIR" -name "${ENVIRONMENT}_backup_*.sql" -type f | sort -r)
  
  if [ -z "$backups" ]; then
    echo "No backups found for ${ENVIRONMENT} environment."
    return 1
  fi
  
  # Print backup files with index
  local i=1
  while read -r backup; do
    local size=$(du -h "$backup" | cut -f1)
    local date=$(stat -c %y "$backup" | cut -d. -f1)
    echo "$i) $(basename "$backup") (${size}, ${date})"
    i=$((i+1))
  done <<< "$backups"
  
  return 0
}

# Function to get a specific backup file
function getBackupFile() {
  # Handle 'latest' keyword
  if [ "$BACKUP_FILE" == "latest" ]; then
    BACKUP_FILE=$(find "$BACKUP_DIR" -name "${ENVIRONMENT}_backup_*.sql" -type f | sort -r | head -n1)
    if [ -z "$BACKUP_FILE" ]; then
      echo -e "${RED}Error: No backups found for ${ENVIRONMENT} environment${NC}"
      exit 1
    fi
    echo -e "${YELLOW}Using latest backup: $(basename "$BACKUP_FILE")${NC}"
    return 0
  fi
  
  # Handle specific backup file
  if [ -n "$BACKUP_FILE" ]; then
    # Check if the file exists directly
    if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
      BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
      return 0
    fi
    
    # Check if the file exists with environment prefix
    if [ -f "$BACKUP_DIR/${ENVIRONMENT}_${BACKUP_FILE}" ]; then
      BACKUP_FILE="$BACKUP_DIR/${ENVIRONMENT}_${BACKUP_FILE}"
      return 0
    fi
    
    # Check if the file exists as is
    if [ -f "$BACKUP_FILE" ]; then
      return 0
    fi
    
    echo -e "${RED}Error: Backup file '${BACKUP_FILE}' not found${NC}"
    exit 1
  fi
  
  # If no backup file is specified, list available backups and prompt user to select one
  if ! listBackups; then
    echo -e "${RED}Error: No backups available for rollback${NC}"
    exit 1
  fi
  
  if [ "$CONFIRM" != "yes" ]; then
    echo ""
    echo -e "${YELLOW}Please enter the number of the backup to restore, or 'q' to quit:${NC}"
    read -r selection
    
    if [[ "$selection" == "q" ]]; then
      echo "Rollback cancelled."
      exit 0
    fi
    
    if ! [[ "$selection" =~ ^[0-9]+$ ]]; then
      echo -e "${RED}Error: Invalid selection${NC}"
      exit 1
    fi
    
    BACKUP_FILE=$(find "$BACKUP_DIR" -name "${ENVIRONMENT}_backup_*.sql" -type f | sort -r | sed -n "${selection}p")
    
    if [ -z "$BACKUP_FILE" ]; then
      echo -e "${RED}Error: Invalid selection${NC}"
      exit 1
    fi
  else
    # In automatic mode, use the latest backup
    BACKUP_FILE=$(find "$BACKUP_DIR" -name "${ENVIRONMENT}_backup_*.sql" -type f | sort -r | head -n1)
    if [ -z "$BACKUP_FILE" ]; then
      echo -e "${RED}Error: No backups found for ${ENVIRONMENT} environment${NC}"
      exit 1
    fi
    echo -e "${YELLOW}Using latest backup in automatic mode: $(basename "$BACKUP_FILE")${NC}"
  fi
  
  return 0
}

# Function to restore from a backup file
function restoreBackup() {
  echo -e "${YELLOW}Preparing to restore from backup: $(basename "$BACKUP_FILE")${NC}"
  
  # Confirm restore
  if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}WARNING: This will overwrite the current database state for the ${ENVIRONMENT} environment.${NC}"
    echo "All data changes since the backup was created will be lost."
    echo ""
    echo -e "${YELLOW}Are you sure you want to proceed? (yes/no)${NC}"
    read -r confirmation
    
    if [ "$confirmation" != "yes" ]; then
      echo "Rollback cancelled."
      exit 0
    fi
  fi
  
  # Create a backup of the current state before restoring
  local pre_restore_backup=$(createBackup)
  
  echo -e "${YELLOW}Restoring database from backup...${NC}"
  
  # Restore from backup
  if psql "$DATABASE_URL" < "$BACKUP_FILE"; then
    echo -e "${GREEN}Database successfully restored from: $(basename "$BACKUP_FILE")${NC}"
    echo "A backup of the previous state was created: $(basename "$pre_restore_backup")"
  else
    echo -e "${RED}Error: Failed to restore database${NC}"
    echo "You can find a backup of the database state before the failed restore attempt here: $(basename "$pre_restore_backup")"
    exit 1
  fi
}

# Main function
function main() {
  echo -e "${YELLOW}BlueEarthOne Database Rollback Tool${NC}"
  echo "Environment: $ENVIRONMENT"
  
  # Check for help flag
  if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    printUsage
    exit 0
  fi
  
  # Validate environment
  if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo -e "${RED}Error: Invalid environment '${ENVIRONMENT}'${NC}"
    echo "Valid environments are: development, staging, production"
    printUsage
    exit 1
  fi
  
  # Check for required tools
  checkPgTools
  
  # Check database connection
  checkDatabaseConnection
  
  # If running in production, display additional warning
  if [ "$ENVIRONMENT" == "production" ] && [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}CAUTION: You are about to rollback the PRODUCTION database!${NC}"
    echo "This is a potentially destructive operation that will affect live data."
    echo ""
    echo -e "${YELLOW}Please type 'I UNDERSTAND' to confirm:${NC}"
    read -r prod_confirmation
    
    if [ "$prod_confirmation" != "I UNDERSTAND" ]; then
      echo "Rollback cancelled."
      exit 0
    fi
  fi
  
  # If no backup file specified, list available backups for selection
  if [ -z "$BACKUP_FILE" ]; then
    getBackupFile
  else
    getBackupFile
  fi
  
  # Restore the database
  restoreBackup
  
  echo -e "${GREEN}Rollback completed successfully!${NC}"
}

# Execute main function
main "$@"