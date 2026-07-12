#!/bin/bash
# One-time VPS setup: upgrade Node.js to 22 LTS (recommended for production)
# Usage: sudo bash scripts/setup-vps-node22.sh

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Upgrading VPS Node.js to 22 LTS...${NC}"
echo "Current: $(node -v 2>/dev/null || echo 'not installed')"

if command -v dnf &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
    dnf install -y nodejs
elif command -v apt-get &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
else
    echo "Unsupported OS. Install Node 22 LTS manually: https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}Done. Node.js: $(node -v), npm: $(npm -v)${NC}"
echo "Restart PM2 after deploy: pm2 restart dsmuaythaiticket-backend"
