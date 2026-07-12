#!/bin/bash

# =====================================================
# Update DSMuayThaiTicket Project Script
# วิธีใช้: sudo /var/www/update-dsmuaythaiticket.sh
# =====================================================

echo "========================================="
echo "Updating DSMuayThaiTicket Project..."
echo "========================================="

# ตั้งค่า colors สำหรับแสดงผล
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ===========================
# 0️⃣ Node.js & build tools check
# ===========================
echo -e "${YELLOW}[0/6] Checking Node.js and build tools...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Install Node.js 22 LTS on the VPS first.${NC}"
    echo "  Recommended: curl -fsSL https://rpm.nodesource.com/setup_22.x | bash - && dnf install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node -v)
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
echo "  Node.js: ${NODE_VERSION}"

# better-sqlite3@12.11+ ships prebuilt binaries for Node 22+ on Linux.
# Node 20 falls back to source compile and needs make/gcc.
if [ "$NODE_MAJOR" -lt 22 ]; then
    echo -e "${YELLOW}  Warning: Node ${NODE_VERSION} has no prebuilt binaries for better-sqlite3.${NC}"
    echo -e "${YELLOW}  Recommend upgrading VPS to Node 22 LTS for faster, reliable deploys.${NC}"

    if [ -s "/root/.nvm/nvm.sh" ]; then
        # shellcheck source=/dev/null
        source "/root/.nvm/nvm.sh"
        nvm use 22 2>/dev/null || nvm install 22
        NODE_VERSION=$(node -v)
        NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
        echo -e "${GREEN}  Switched to Node ${NODE_VERSION} via nvm${NC}"
    fi
fi

if ! command -v make &> /dev/null; then
    echo -e "${YELLOW}  Installing build tools (required for native modules on Node 20)...${NC}"
    if command -v dnf &> /dev/null; then
        dnf install -y gcc gcc-c++ make python3
    elif command -v yum &> /dev/null; then
        yum install -y gcc gcc-c++ make python3
    elif command -v apt-get &> /dev/null; then
        apt-get update && apt-get install -y build-essential python3
    else
        echo -e "${RED}✗ 'make' not found and no supported package manager detected.${NC}"
        echo "  Install build tools manually, or upgrade Node.js to 22 LTS."
        exit 1
    fi
fi

if [ "$NODE_MAJOR" -lt 22 ] && ! command -v make &> /dev/null; then
    echo -e "${RED}✗ Cannot build better-sqlite3 without make/gcc or Node 22+ prebuilds.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment ready (Node ${NODE_VERSION})${NC}"

# ===========================
# 1️⃣ Pull latest code
# ===========================
echo -e "${YELLOW}[1/6] Pulling latest code from GitHub...${NC}"
cd /var/www/dsmuaythaiticket || { echo -e "${RED}✗ Project directory not found${NC}"; exit 1; }

# ใช้ reset hard ให้ตรงกับ remote 100%
git fetch origin main
git reset --hard origin/main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Git pull (reset hard) successful${NC}"
else
    echo -e "${RED}✗ Git pull failed${NC}"
    exit 1
fi

# ===========================
# 2️⃣ Update Backend dependencies
# ===========================
echo -e "${YELLOW}[2/6] Updating backend dependencies...${NC}"
cd backend || { echo -e "${RED}✗ Backend directory not found${NC}"; exit 1; }
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend dependencies updated${NC}"
else
    echo -e "${RED}✗ Backend npm install failed${NC}"
    exit 1
fi

# ===========================
# 3️⃣ Restart Backend (PM2)
# ===========================
echo -e "${YELLOW}[3/6] Restarting backend with PM2...${NC}"
pm2 restart dsmuaythaiticket-backend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend restarted${NC}"
else
    echo -e "${RED}✗ Backend restart failed${NC}"
fi

# ===========================
# 4️⃣ Update & Build Frontend
# ===========================
echo -e "${YELLOW}[4/6] Updating and rebuilding frontend...${NC}"
cd ../frontend || { echo -e "${RED}✗ Frontend directory not found${NC}"; exit 1; }
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend dependencies updated${NC}"
else
    echo -e "${RED}✗ Frontend npm install failed${NC}"
    exit 1
fi

# Build frontend (default build skips prerender - Puppeteer/Chrome not available on VPS)
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend built successfully${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi

# ===========================
# 5️⃣ Restart Nginx
# ===========================
echo -e "${YELLOW}[5/6] Restarting Nginx...${NC}"
systemctl restart nginx

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Nginx restarted${NC}"
else
    echo -e "${RED}✗ Nginx restart failed${NC}"
fi

# ===========================
# Show PM2 Status & Logs
# ===========================
echo ""
echo "========================================="
echo "Backend Status (PM2):"
echo "========================================="
pm2 list

echo ""
echo "========================================="
echo "Recent Backend Logs (last 20 lines):"
echo "========================================="
pm2 logs dsmuaythaiticket-backend --lines 20 --nostream

# ===========================
# Finished
# ===========================
echo ""
echo -e "${GREEN}========================================="
echo "Update completed successfully!"
echo "=========================================${NC}"
echo ""
echo "Frontend: https://dsmuaythaiticket.com"
echo "Backend API: https://api.dsmuaythaiticket.com"
echo ""
