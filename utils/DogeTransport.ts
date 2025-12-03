export const DOGE_BASE_URL = "https://wintonswebsiteproxy.onrender.com";
const PROXY_PREFIX = "/uv/service/";
const PROXY_HOSTNAME = "wintonswebsiteproxy.onrender.com";

/**
 * Step 1: Generate the Key (k)
 * Matches uv.config.js: new TextEncoder().encode(...slice(6.7))
 */
function getDailyKey(): Uint8Array {
    // 1. Get UTC Date (YYYY-MM-DD)
    const date = new Date().toISOString().slice(0, 10);
    
    // 2. Concatenate Date + Hostname
    const base = date + PROXY_HOSTNAME;
    
    // 3. Base64 Encode
    const b64 = btoa(base);
    
    // 4. Reverse string
    const reversed = b64.split('').reverse().join('');
    
    // 5. Slice first 6 chars (JS treats slice(6.7) as slice(6))
    const rawKey = reversed.slice(6);
    
    // 6. Return as Byte Array (Uint8Array)
    return new TextEncoder().encode(rawKey);
}

/**
 * Step 2: XOR Encryption
 * Matches uv.config.js: o[i] = d[i] ^ k[i % 8]
 */
function uvEncode(url: string): string {
    if (!url) return '';
    
    // Convert target URL to Bytes (UTF-8)
    const urlBytes = new TextEncoder().encode(url);
    const key = getDailyKey();
    
    let result = '';
    
    for (let i = 0; i < urlBytes.length; i++) {
        // XOR the byte with the key byte (cyclic mod 8)
        const xor = urlBytes[i] ^ key[i % 8];
        
        // Convert to 2-digit Hex
        result += xor.toString(16).padStart(2, '0');
    }
    
    return result;
}

/**
 * Step 3: Final Output
 */
export function transport(targetUrl: string, mode: "HOME" | "SCHOOL" | "LOCKED" | string): string {
  // If not SCHOOL mode, return original URL (or handle otherwise)
  if (mode !== 'SCHOOL') {
    return targetUrl;
  }

  const encryptedHash = uvEncode(targetUrl);
  
  // Ensure we don't end up with double slashes if DOGE_BASE_URL has one
  const cleanBase = DOGE_BASE_URL.endsWith('/') ? DOGE_BASE_URL.slice(0, -1) : DOGE_BASE_URL;
  
  return `${cleanBase}${PROXY_PREFIX}${encryptedHash}`;
}