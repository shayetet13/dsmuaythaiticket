# 🔐 Security Setup Guide - FT Muay Thai Tickets

## ⚠️ CRITICAL: Protecting API Tokens & Secrets

### 🚨 NEVER Commit These Files:
- ❌ `.env`
- ❌ `.env.local`
- ❌ `.env.production`
- ❌ `*.key`, `*.pem`, `*.cert`
- ❌ `secrets.json`, `config.json`

---

## 📝 Setup Instructions

### 1. **สร้างไฟล์ Environment Variables**

#### Development (.env.local):
```bash
cd mticket/frontend
cp .env.local.example .env.local
```

แก้ไข `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
```

#### Production (.env.production):
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_API_TOKEN=your-production-token-here
VITE_API_KEY=your-production-api-key-here
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
```

---

### 2. **ตรวจสอบ .gitignore**

ตรวจสอบว่าไฟล์เหล่านี้อยู่ใน `.gitignore`:
```
.env
.env.local
.env.production
*.env
*.key
*.pem
*.cert
secrets.json
```

---

### 3. **Verify Security**

#### ตรวจสอบว่าไม่มี hardcoded secrets:
```bash
# Search for hardcoded URLs
grep -r "http://localhost:5000" src/
grep -r "localhost:5000" src/

# Search for potential secrets
grep -r "token.*=" src/
grep -r "api.*key" src/
```

**ควรไม่พบผลลัพธ์** (ยกเว้นใน comments หรือ docs)

---

## 🔒 Security Features

### ✅ Implemented:

1. **Environment Variables**
   - API URLs จาก `.env`
   - Tokens จาก `.env` (ไม่ hardcode)
   - Feature flags จาก `.env`

2. **API Client Security**
   - Automatic token injection
   - Request ID tracking
   - Rate limiting (10 req/min)
   - Error sanitization

3. **Input Security**
   - Input sanitization
   - XSS prevention
   - Form validation

4. **Data Protection**
   - Sensitive data masking
   - Secure storage
   - Token clearing

---

## 🧪 Testing Security

### Test 1: Environment Variables
```bash
# ตรวจสอบว่า env vars ถูกโหลด
npm run dev
# เปิด browser console
# ควรเห็น: import.meta.env.VITE_API_BASE_URL
```

### Test 2: No Hardcoded Secrets
```bash
# Search for hardcoded values
grep -r "localhost:5000" src/
# ควรไม่พบ (ยกเว้นใน comments)
```

### Test 3: Git Ignore
```bash
# ตรวจสอบว่า .env ไม่ถูก track
git status
# .env ควรไม่แสดงใน untracked files
```

---

## 📚 API Usage

### ✅ Correct Way:
```javascript
import { bookingService } from '@/services/api';

// Token จะถูก inject อัตโนมัติจาก environment variable
const booking = await bookingService.createBooking(data);
```

### ❌ Wrong Way:
```javascript
// ❌ NEVER do this:
const API_URL = 'http://localhost:5000/api';
const TOKEN = 'hardcoded-token-123';
```

---

## 🔍 Security Checklist

- [x] `.env` files in `.gitignore`
- [x] `.env.example` created (no secrets)
- [x] No hardcoded API URLs
- [x] No hardcoded tokens
- [x] API service layer implemented
- [x] Input validation
- [x] Error sanitization
- [x] Rate limiting
- [x] Security headers

---

## 🚨 If Secrets Are Exposed

### Immediate Actions:

1. **Rotate All Secrets**
   - Generate new API tokens
   - Update `.env` files
   - Update production environment

2. **Check Git History**
   ```bash
   git log --all --full-history -- .env
   ```

3. **Remove from Git**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   ```

4. **Force Push** (if necessary)
   ```bash
   git push origin --force --all
   ```

---

## 📖 Best Practices

1. ✅ **Always use environment variables**
2. ✅ **Never commit .env files**
3. ✅ **Use API service layer**
4. ✅ **Validate all inputs**
5. ✅ **Sanitize outputs**
6. ✅ **Use HTTPS in production**
7. ✅ **Rotate secrets regularly**
8. ✅ **Monitor for exposed secrets**

---

**สร้างเมื่อ:** 3 มกราคม 2026  
**Version:** 1.0.0

