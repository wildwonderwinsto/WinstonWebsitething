// DogeTransport.ts - Ultraviolet Proxy Transport Utility
// Handles URL encryption and proxy wrapping for secure streaming

export const DOGE_BASE_URL = "https://wintonswebsiteproxy.onrender.com";
const PROXY_PREFIX = "/uv/service/";
const PROXY_HOSTNAME = "wintonswebsiteproxy.onrender.com";

/**
 * Generates a daily encryption key based on current date
 * This ensures URLs expire daily for security
 */
function getDailyKey(): Uint8Array {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const rawInput = date + PROXY_HOSTNAME;
  const b64 = btoa(rawInput);
  const reversed = b64.split('').reverse().join('');
  const keyString = reversed.slice(6);
  return new TextEncoder().encode(keyString);
}

/**
 * Custom UV Encoding - Encrypts URL using XOR with daily key
 * Matches Ultraviolet's encoding expectations
 */
function uvEncode(url: string): string {
  if (!url) return '';
  
  try {
    const k = getDailyKey();
    const urlBytes = new TextEncoder().encode(url);
    let encrypted = '';
    
    // XOR each byte with the key and convert to hex
    for (let i = 0; i < urlBytes.length; i++) {
      const byteVal = urlBytes[i];
      const xorged = byteVal ^ k[i % 8]; // Use key byte with wrap-around
      encrypted += xorged.toString(16).padStart(2, '0');
    }
    
    return encrypted;
  } catch (e) {
    console.error("❌ Encryption failed", e);
    return encodeURIComponent(url); // Fallback to basic encoding
  }
}

/**
 * Main transport function
 * - HOME mode: Returns raw URL directly
 * - SCHOOL mode: Encrypts URL and wraps with go.html for SW registration
 * - LOCKED mode: Returns empty (shouldn't be used)
 */
export function transport(
  targetUrl: string, 
  mode: "HOME" | "SCHOOL" | "LOCKED" | string
): string {
  if (!targetUrl) return '';
  
  // In HOME mode, bypass proxy entirely
  if (mode !== 'SCHOOL') {
    return targetUrl;
  }
  
  // SCHOOL mode: Encrypt and wrap with go.html
  try {
    const encryptedHash = uvEncode(targetUrl);
    const cleanBase = DOGE_BASE_URL.replace(/\/$/, "");
    
    // go.html will:
    // 1. Register the Ultraviolet Service Worker
    // 2. Redirect to /uv/service/[encrypted_url]
    const proxyUrl = `${cleanBase}/go.html#${encryptedHash}`;
    
    console.log('🔐 Encrypted URL:', proxyUrl);
    return proxyUrl;
  } catch (error) {
    console.error('❌ Transport error:', error);
    return targetUrl; // Fallback to raw URL
  }
}