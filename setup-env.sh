#!/bin/bash

# CardioManager Environment Setup Script
# This script helps initialize environment variables for development

set -e

echo "======================================"
echo "CardioManager Environment Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API Setup
echo -e "${YELLOW}Setting up API (.env)...${NC}"
if [ ! -f "apps/api/.env" ]; then
  cp apps/api/.env.example apps/api/.env
  echo -e "${GREEN}✓ Created apps/api/.env${NC}"
  echo ""
  echo "Please configure the following in apps/api/.env:"
  echo "  - DATABASE_URL: PostgreSQL connection string"
  echo "  - JWT_SECRET: A strong random secret (min 32 characters)"
  echo "  - CORS_ORIGIN: Frontend URL(s)"
  echo ""
  read -p "Press Enter to continue..."
else
  echo -e "${GREEN}✓ apps/api/.env already exists${NC}"
fi

# Web Setup
echo -e "${YELLOW}Setting up Web (.env.local)...${NC}"
if [ ! -f "apps/web/.env.local" ]; then
  cp apps/web/.env.example apps/web/.env.local
  echo -e "${GREEN}✓ Created apps/web/.env.local${NC}"
  echo ""
  echo "Configure in apps/web/.env.local if needed:"
  echo "  - NEXT_PUBLIC_API_BASE: Backend API URL"
  echo "  - NEXT_PUBLIC_APP_NAME: Application name"
  echo ""
else
  echo -e "${GREEN}✓ apps/web/.env.local already exists${NC}"
fi

echo ""
echo -e "${GREEN}======================================"
echo "Environment setup completed!"
echo "=====================================${NC}"
echo ""
echo "Next steps:"
echo "1. Update apps/api/.env with your database credentials"
echo "2. Generate a strong JWT_SECRET for production use"
echo "3. Run: npm run db:init (to initialize the database)"
echo "4. Run: npm run dev (to start development)"
echo ""
