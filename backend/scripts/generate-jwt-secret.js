/**
 * Generate JWT Secret Key
 * Run with: node scripts/generate-jwt-secret.js
 */

import crypto from 'crypto';

// Generate a secure random 32-byte (64 hex characters) secret
const secret = crypto.randomBytes(32).toString('hex');

console.log('='.repeat(60));
console.log('JWT_SECRET generated successfully!');
console.log('='.repeat(60));
console.log('');
console.log('Add this to your .env file:');
console.log('');
console.log(`JWT_SECRET=${secret}`);
console.log('');
console.log('='.repeat(60));
console.log('');
console.log('⚠️  IMPORTANT: Keep this secret secure and never commit it to git!');
console.log('');
