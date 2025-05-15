#!/bin/bash
# Deployment rollback script

# Default values
ENV=${1:-"staging"}
VERSION=${2:-""}
DEPLOYMENT_DIR=${3:-"/var/www/blueearth"}
BACKUP_DIR=${DEPLOYMENT_DIR}/backups

# Print usage information
function usage() {
  echo "Usage: $0 <environment> <version> [deployment_dir]"
  echo "  environment: The environment to rollback (staging, production)"
  echo "  version: The version to rollback to (in format YYYYMMDDHHMMSS-commit)"
  echo "  deployment_dir: Directory where application is deployed (default: /var/www/blueearth)"
  exit 1
}

# Check parameters
if [ -z "$ENV" ] || [ -z "$VERSION" ]; then
  echo "Error: Missing required parameters!"
  usage
fi

# Validate environment
if [ "$ENV" != "staging" ] && [ "$ENV" != "production" ]; then
  echo "Error: Environment must be either 'staging' or 'production'"
  usage
fi

# Find backup package for the requested version
BACKUP_PACKAGE="${BACKUP_DIR}/${ENV}/blueearth-${VERSION}.zip"

if [ ! -f "$BACKUP_PACKAGE" ]; then
  echo "Error: Backup package for version ${VERSION} not found at ${BACKUP_PACKAGE}"
  
  # List available backups
  echo "Available backup versions for ${ENV}:"
  ls -la ${BACKUP_DIR}/${ENV}/ | grep "blueearth-" | awk '{print $9}' | sed 's/blueearth-//' | sed 's/.zip//'
  
  exit 1
fi

echo "Starting rollback to version ${VERSION} in ${ENV} environment"
echo "------------------------------------------------------"

# Create temporary directory for rollback
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: ${TEMP_DIR}"

# Extract backup package
echo "Extracting backup package to temporary directory..."
unzip -q "$BACKUP_PACKAGE" -d "$TEMP_DIR"

# Backup current deployment
CURRENT_DATE=$(date +%Y%m%d%H%M%S)
CURRENT_DIR="${DEPLOYMENT_DIR}/${ENV}/current"
BACKUP_NAME="pre-rollback-${CURRENT_DATE}"
BACKUP_PATH="${BACKUP_DIR}/${ENV}/${BACKUP_NAME}"

echo "Backing up current deployment to ${BACKUP_PATH}..."
mkdir -p "$BACKUP_PATH"
cp -R "${CURRENT_DIR}/"* "$BACKUP_PATH/"

# Stop the current application
echo "Stopping the current application..."
systemctl stop "blueearth-${ENV}" || echo "Warning: Failed to stop application service"

# Deploy the rollback version
echo "Deploying version ${VERSION}..."
rm -rf "${CURRENT_DIR:?}/"*
cp -R "${TEMP_DIR}/"* "$CURRENT_DIR/"

# Run database migrations for rollback (if needed)
echo "Running database migrations..."
cd "$CURRENT_DIR" && npm run db:migrate || echo "Warning: Database migration failed"

# Start the application with the rolled back version
echo "Starting the application..."
systemctl start "blueearth-${ENV}" || echo "Warning: Failed to start application service"

# Clean up temporary directory
echo "Cleaning up temporary directory..."
rm -rf "$TEMP_DIR"

# Run health checks
echo "Running health checks..."
if [ "$ENV" == "staging" ]; then
  API_URL="https://staging.blueearth.example.com"
else
  API_URL="https://app.blueearth.example.com"
fi

"${CURRENT_DIR}/scripts/health-check.sh" "$API_URL" 20 3

if [ $? -eq 0 ]; then
  echo "------------------------------------------------------"
  echo "✅ Rollback to version ${VERSION} completed successfully!"
  echo "Application is now running and passed all health checks."
else
  echo "------------------------------------------------------"
  echo "❌ Rollback appeared to complete, but health checks failed."
  echo "Manual intervention may be required."
  exit 1
fi