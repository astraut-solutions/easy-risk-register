// utils/encryption/encrypt.js - Data encryption utilities using Node.js crypto
import crypto from 'crypto';

// Encryption key (in production, use environment variable or key management service)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'); // 256-bit key
const IV_LENGTH = 16; // For AES-256-CBC, IV is always 16 bytes

export function encrypt(text) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'));
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
}

export function decrypt(text) {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = textParts.join(':');
    
    const decipher = crypto.createDecipher('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'));
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
}

// Alternative encryption using crypto-js for compatibility
export function encryptWithCryptoJS(text) {
  // This is a fallback approach if needed for frontend compatibility
  // In a real implementation, we'd use the crypto-js library
  // For now, we'll return the same result as the Node.js crypto implementation
  return encrypt(text);
}

export function decryptWithCryptoJS(text) {
  // This is a fallback approach if needed for frontend compatibility
  // In a real implementation, we'd use the crypto-js library
  // For now, we'll return the same result as the Node.js crypto implementation
  return decrypt(text);
}

export default {
  encrypt,
  decrypt,
  encryptWithCryptoJS,
  decryptWithCryptoJS
};