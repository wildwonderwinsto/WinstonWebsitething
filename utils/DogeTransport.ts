export const DOGE_BASE_URL = "https://wintonswebsiteproxy.onrender.com";
const PROXY_PREFIX = "/uv/service/";
const PROXY_HOSTNAME = "wintonswebsiteproxy.onrender.com";

/**
 * Step 1: Generate the Daily Key (k)
 * Algorithm: Reverse(Base64(Date + Hostname)).slice(6)
 */
function getDailyKey(): string {
    // 1. Get current date in YYYY-MM-DD
    const date = new Date().toISOString().split('T')[0];
    
    // 2. Concatenate Date + Proxy Domain
    const base = date + PROXY_HOSTNAME;
    
    // 3. Base64 encode
    const b64 = btoa(base);
    
    // 4. Reverse the string
    const reversed = b64.split('').reverse().join('');
    
    // 5. Remove first 6 characters
    const key = reversed.slice(6);
    
    return key;
}

/**
 * Step 2: XOR Encryption
 * Algorithm: Char ^ KeyChar (Cyclic % 8) -> Hex
 */
function uvEncode(url: string): string {
    if (!url) return '';
    
    const key = getDailyKey();
    let encrypted = '';
    
    for (let i = 0; i < url.length; i++) {
        // 1. Convert char to byte
        const charCode = url.charCodeAt(i);
        
        // 2. Get Key Char Code (Cyclic index % 8 as requested)
        // We use % 8 specifically per your instructions, 
        // provided the key is at least 8 chars (it will be).
        const keyChar = key.charCodeAt(i % 8);
        
        // 3. XOR
        const xor = charCode ^ keyChar;
        
        // 4. Convert to 2-digit Hex
        encrypted += xor.toString(16).padStart(2, '0');
    }
    
    return encrypted;
}

/**
 * Step 3: Transport Logic
 * Combines Base + Prefix + Encrypted Hash
 */
export function transport(targetUrl: string, mode: "HOME" | "SCHOOL" | "LOCKED" | string): string {
  // If not in SCHOOL mode, return the raw URL (or handle differently)
  if (mode !== 'SCHOOL') {
    return targetUrl;
  }

  // SCHOOL MODE: Encrypt
  const encryptedHash = uvEncode(targetUrl);
  
  // Ensure clean base URL (remove trailing slash if present to avoid double slash)
  const cleanBase = DOGE_BASE_URL.endsWith('/') ? DOGE_BASE_URL.slice(0, -1) : DOGE_BASE_URL;
  
  return `${cleanBase}${PROXY_PREFIX}${encryptedHash}`;
}