export const DOGE_BASE_URL = "https://wintonswebsiteproxy.onrender.com";
const PROXY_PREFIX = "/uv/service/";
const PROXY_HOSTNAME = "wintonswebsiteproxy.onrender.com";

/**
 * Step 1: Generate the Key (k)
 * Returns Uint8Array to match uv.config.js byte logic
 */
function getDailyKey(): Uint8Array {
    // 1. Date (UTC) - Must match server time
    const date = new Date().toISOString().slice(0, 10);
    
    // 2. Concatenate
    const base = date + PROXY_HOSTNAME;
    
    // 3. Base64
    const b64 = btoa(base);
    
    // 4. Reverse
    const reversed = b64.split('').reverse().join('');
    
    // 5. Slice(6) and Convert to Bytes
    // Note: slice(6.7) in JS acts as slice(6)
    const rawKey = reversed.slice(6);
    return new TextEncoder().encode(rawKey);
}

/**
 * Step 2: XOR Encryption (Byte-Perfect)
 */
function uvEncode(url: string): string {
    if (!url) return '';
    
    // CRITICAL FIX: Do NOT encodeURIComponent here.
    // The backend expects to decrypt the Raw URL (e.g. "https://..."), not "https%3A%2F%2F..."
    // TextEncoder handles the UTF-8 conversion of the raw string for us.
    
    try {
        const keyBytes = getDailyKey();
        const urlBytes = new TextEncoder().encode(url);
        let encrypted = '';
        
        for (let i = 0; i < urlBytes.length; i++) {
            // Byte-level XOR
            const byte = urlBytes[i];
            const keyByte = keyBytes[i % 8]; // Cyclic key
            
            const xor = byte ^ keyByte;
            
            // Hex padding
            encrypted += xor.toString(16).padStart(2, '0');
        }
        
        return encrypted;
    } catch (e) {
        console.error("Encryption failed", e);
        return '';
    }
}

/**
 * Step 3: Final Output
 */
export function transport(targetUrl: string, mode: "HOME" | "SCHOOL" | "LOCKED"): string {
  if (mode === 'HOME' || mode === 'LOCKED') {
    return targetUrl;
  }

  // SCHOOL MODE: Encrypt
  const encryptedHash = uvEncode(targetUrl);
  
  // Ensure clean base URL
  const cleanBase = DOGE_BASE_URL.endsWith('/') ? DOGE_BASE_URL.slice(0, -1) : DOGE_BASE_URL;
  
  return `${cleanBase}${PROXY_PREFIX}${encryptedHash}`;
}