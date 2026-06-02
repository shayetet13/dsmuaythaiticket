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
# 1️⃣ Pull latest code
# ===========================
echo -e "${YELLOW}[1/5] Pulling latest code from GitHub...${NC}"
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
echo -e "${YELLOW}[2/5] Updating backend dependencies...${NC}"
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
echo -e "${YELLOW}[3/5] Restarting backend with PM2...${NC}"
pm2 restart dsmuaythaiticket-backend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend restarted${NC}"
else
    echo -e "${RED}✗ Backend restart failed${NC}"
fi

# ===========================
# 4️⃣ Update & Build Frontend
# ===========================
echo -e "${YELLOW}[4/5] Updating and rebuilding frontend...${NC}"
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
echo -e "${YELLOW}[5/5] Restarting Nginx...${NC}"
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
