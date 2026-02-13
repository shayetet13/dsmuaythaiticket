/**
 * JWT Service
 * Handles JWT token creation and verification for email verification
 */

import jwt from 'jsonwebtoken';

// JWT Secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET;

// Validate JWT_SECRET
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('[JWTService] ⚠️  JWT_SECRET is not set or too short!');
  console.error('[JWTService] Please set JWT_SECRET in .env file (minimum 32 characters)');
  console.error('[JWTService] Generate with: openssl rand -hex 32');
}

/**
 * Sign JWT token for email verification
 * @param {Object} payload - Token payload { email, verificationId }
 * @param {number} expiresInMinutes - Expiration time in minutes (default: 30)
 * @returns {string} JWT token
 */
export const signVerificationToken = (payload, expiresInMinutes = 30) => {
  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    if (!payload.email || !payload.verificationId) {
      throw new Error('Payload must include email and verificationId');
    }

    const token = jwt.sign(
      {
        email: payload.email,
        verificationId: payload.verificationId,
        iat: Math.floor(Date.now() / 1000) // Issued at time
      },
      JWT_SECRET,
      {
        expiresIn: `${expiresInMinutes}m` // Expires in minutes
      }
    );

    console.log('[JWTService] Token signed for:', payload.email);
    return token;

  } catch (error) {
    console.error('[JWTService] Error signing token:', error.message);
    throw new Error(`Failed to sign token: ${error.message}`);
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload { email, verificationId, iat, exp }
 * @throws {Error} If token is invalid, expired, or signature doesn't match
 */
export const verifyVerificationToken = (token) => {
  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    if (!token || typeof token !== 'string') {
      throw new Error('Token is required and must be a string');
    }

    // Verify token signature and expiration
    const decoded = jwt.verify(token, JWT_SECRET);

    // Validate required fields
    if (!decoded.email || !decoded.verificationId) {
      throw new Error('Token payload is missing required fields');
    }

    console.log('[JWTService] Token verified for:', decoded.email);
    return decoded;

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.warn('[JWTService] Token expired');
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      console.warn('[JWTService] Invalid token:', error.message);
      throw new Error('Invalid token');
    } else {
      console.error('[JWTService] Error verifying token:', error.message);
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }
};

/**
 * Check if JWT service is properly configured
 * @returns {boolean}
 */
export const isConfigured = () => {
  return !!JWT_SECRET && JWT_SECRET.length >= 32;
};

export default {
  signVerificationToken,
  verifyVerificationToken,
  isConfigured
};
