
export const DOGE_BASE_URL = "https://wintonswebsiteproxy.onrender.com";
const PROXY_PREFIX = "/uv/service/";
const PROXY_HOSTNAME = "wintonswebsiteproxy.onrender.com";

function getDailyKey(): string {
    // Step 1: Get Date YYYY-MM-DD (UTC)
    const date = new Date().toISOString().slice(0, 10);
    
    // Step 2: Concatenate
    const base = date + PROXY_HOSTNAME;
    
    // Step 3: Base64 Encode
    const b64 = btoa(base);
    
    // Step 4: Reverse
    const reversed = b64.split('').reverse().join('');
    
    // Step 5: Remove first 6 chars to get Key (k)
    const key = reversed.slice(6);
    return key;
}

function uvEncode(url: string): string {
    if (!url) return '';
    
    try {
        const key = getDailyKey();
        let encrypted = '';
        
        for (let i = 0; i < url.length; i++) {
            const charCode = url.charCodeAt(i);
            
            // Step 6: XOR with Key Cyclic (i % 8)
            // Note: Key_Index = i % 8
            const keyChar = key.charCodeAt(i % 8);
            const xor = charCode ^ keyChar;
            
            // Step 7: Convert to Hex (2 digits)
            encrypted += xor.toString(16).padStart(2, '0');
        }
        
        return encrypted;
    } catch (e) {
        console.error("Encryption failed", e);
        return encodeURIComponent(url);
    }
}

export function transport(targetUrl: string, mode: "HOME" | "SCHOOL" | "LOCKED"): string {
  if (mode === 'HOME' || mode === 'LOCKED') {
    return targetUrl;
  }

  // SCHOOL MODE: Encrypt and Wrap
  const encryptedHash = uvEncode(targetUrl);
  
  // Ensure clean base URL
  const base = DOGE_BASE_URL.endsWith('/') ? DOGE_BASE_URL.slice(0, -1) : DOGE_BASE_URL;
  
  // Step 8: Final Output
  return `${base}${PROXY_PREFIX}${encryptedHash}`;
}
