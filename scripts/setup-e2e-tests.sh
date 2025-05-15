#!/bin/bash

# E2E Test Setup Script for BlueEarthOne
# 
# This script sets up the environment for running end-to-end tests.
# It ensures the database is in the right state, test fixtures are loaded,
# and the application is running with the correct configuration.
#
# Usage:
#   ./setup-e2e-tests.sh [options]
#
# Options:
#   --reset           Reset the database before running tests
#   --fixtures-only   Only create test fixtures without running tests
#   --no-fixtures     Don't create test fixtures, assume they exist
#   --help            Show this help message

set -e

# Default values
RESET_DB=false
FIXTURES_ONLY=false
NO_FIXTURES=false
TEST_ENV="test"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print usage
function print_usage {
    echo "E2E Test Setup Script for BlueEarthOne"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --reset           Reset the database before running tests"
    echo "  --fixtures-only   Only create test fixtures without running tests"
    echo "  --no-fixtures     Don't create test fixtures, assume they exist"
    echo "  --help            Show this help message"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --reset)
            RESET_DB=true
            shift
            ;;
        --fixtures-only)
            FIXTURES_ONLY=true
            shift
            ;;
        --no-fixtures)
            NO_FIXTURES=true
            shift
            ;;
        --help)
            print_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Error: Unknown option $1${NC}"
            print_usage
            exit 1
            ;;
    esac
done

# Print banner
echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}  BlueEarthOne E2E Test Setup  ${NC}"
echo -e "${BLUE}==============================================${NC}"
echo ""

# Check NodeJS
echo -e "${BLUE}Checking Node.js environment...${NC}"
node_version=$(node -v)
npm_version=$(npm -v)
echo -e "Node.js version: ${node_version}"
echo -e "NPM version: ${npm_version}"
echo ""

# Check environment variables
echo -e "${BLUE}Checking environment variables...${NC}"
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
    exit 1
fi
echo -e "${GREEN}Database connection is configured${NC}"
echo ""

# Reset database if requested
if [ "$RESET_DB" = true ]; then
    echo -e "${BLUE}Resetting database...${NC}"
    echo -e "${YELLOW}Warning: This will delete all data in the database!${NC}"
    echo -n "Are you sure you want to continue? [y/N] "
    read confirmation
    if [[ $confirmation == [yY] || $confirmation == [yY][eE][sS] ]]; then
        echo -e "${BLUE}Running migrations to reset the database...${NC}"
        
        # Run your database reset command here
        # This might be calling drizzle-kit, a migration script, or a custom reset function
        NODE_ENV=$TEST_ENV npm run db:push
        
        echo -e "${GREEN}Database reset complete${NC}"
    else
        echo -e "${YELLOW}Database reset cancelled${NC}"
        exit 1
    fi
    echo ""
fi

# Create test fixtures if not skipped
if [ "$NO_FIXTURES" = false ]; then
    echo -e "${BLUE}Creating test fixtures...${NC}"
    
    # Run the script to create test fixtures
    NODE_ENV=$TEST_ENV npx tsx e2e/setup/setupTestData.ts
    
    echo -e "${GREEN}Test fixtures created successfully${NC}"
    echo ""
else
    echo -e "${YELLOW}Skipping test fixture creation${NC}"
    echo ""
fi

# Exit if only creating fixtures
if [ "$FIXTURES_ONLY" = true ]; then
    echo -e "${GREEN}Setup complete! Fixtures have been created.${NC}"
    exit 0
fi

# Print success banner
echo -e "${BLUE}==============================================${NC}"
echo -e "${GREEN}  E2E Test Environment Ready!  ${NC}"
echo -e "${BLUE}==============================================${NC}"
echo ""
echo -e "You can now run E2E tests with: ${BLUE}npm run test:e2e${NC}"
echo ""