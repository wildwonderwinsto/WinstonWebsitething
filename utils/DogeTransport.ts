export const DOGE_BASE_URL = "https://wintonswebsiteproxy.onrender.com";
const PROXY_PREFIX = "/uv/service/";
const PROXY_HOSTNAME = "wintonswebsiteproxy.onrender.com";

/**
 * GENERATE THE KEY (k)
 * Logic: Base64(Date + Host) -> Reverse -> Remove first 6 chars -> XOR Key
 */
function getDailyKey(): Uint8Array {
    // 1. Get current date (UTC) to match server expectation
    // Uses YYYY-MM-DD format
    const date = new Date().toISOString().slice(0, 10);
    
    // 2. Concatenate Date + Host
    const rawInput = date + PROXY_HOSTNAME;
    
    // 3. Base64 Encode
    const b64 = btoa(rawInput);
    
    // 4. Reverse
    const reversed = b64.split('').reverse().join('');
    
    // 5. Remove first 6 chars (slice(6))
    // Note: slice(6.7) in the config behaves identically to slice(6) in JS
    const keyString = reversed.slice(6);
    
    // 6. Return as Bytes
    return new TextEncoder().encode(keyString);
}

/**
 * ENCODE FUNCTION (Inverse of decodeDoge)
 */
function uvEncode(url: string): string {
    if (!url) return '';
    
    try {
        // Get the cyclic key
        const k = getDailyKey();
        
        // Convert Target URL to bytes
        const urlBytes = new TextEncoder().encode(url);
        let encrypted = '';
        
        for (let i = 0; i < urlBytes.length; i++) {
            // Get byte at index
            const byteVal = urlBytes[i];
            
            // XOR against the specific key byte (cyclic i % 8)
            const xorged = byteVal ^ k[i % 8];
            
            // Convert to 2-digit Hex string
            encrypted += xorged.toString(16).padStart(2, '0');
        }
        
        return encrypted;
    } catch (e) {
        console.error("Encryption failed", e);
        return encodeURIComponent(url); // Fallback to standard encoding if crypto fails
    }
}

/**
 * MAIN TRANSPORT FUNCTION
 */
export function transport(targetUrl: string, mode: "HOME" | "SCHOOL" | "LOCKED" | string): string {
  // If not SCHOOL mode, return original URL (Direct Link)
  if (mode !== 'SCHOOL') {
    return targetUrl;
  }

  // SCHOOL MODE: Encrypt
  const encryptedHash = uvEncode(targetUrl);
  
  // Ensure clean base URL construction
  const cleanBase = DOGE_BASE_URL.endsWith('/') ? DOGE_BASE_URL.slice(0, -1) : DOGE_BASE_URL;
  
  // Combine: Base + Prefix + Encrypted Hash
  return `${cleanBase}${PROXY_PREFIX}${encryptedHash}`;
}