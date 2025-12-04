
export const DOGE_BASE_URL = "https://wintonswebsiteproxy.onrender.com";
const PROXY_PREFIX = "/uv/service/";
const PROXY_HOSTNAME = "wintonswebsiteproxy.onrender.com";

/**
 * Step 1: Generate the Key (k)
 * 1. Get current date YYYY-MM-DD (UTC)
 * 2. Concat Date + Proxy Domain
 * 3. Base64 Encode -> Reverse -> Slice(6)
 */
function getDailyKey(): Uint8Array {
    const date = new Date().toISOString().slice(0, 10);
    const rawInput = date + PROXY_HOSTNAME;
    const b64 = btoa(rawInput);
    const reversed = b64.split('').reverse().join('');
    const keyString = reversed.slice(6);
    return new TextEncoder().encode(keyString);
}

/**
 * Step 2: XOR Encryption
 * 1. Convert Target URL to bytes
 * 2. XOR with Key char at (i % 8)
 * 3. Convert to 2-digit Hex
 */
function uvEncode(url: string): string {
    if (!url) return '';
    try {
        const k = getDailyKey();
        const urlBytes = new TextEncoder().encode(url);
        let encrypted = '';
        
        for (let i = 0; i < urlBytes.length; i++) {
            const byteVal = urlBytes[i];
            const xorged = byteVal ^ k[i % 8];
            encrypted += xorged.toString(16).padStart(2, '0');
        }
        return encrypted;
    } catch (e) {
        console.error("Encryption failed", e);
        return encodeURIComponent(url);
    }
}

/**
 * Step 3: Final Output
 */
export function transport(targetUrl: string, mode: "HOME" | "SCHOOL" | "LOCKED" | string): string {
    if (!targetUrl) return '';

    if (mode !== 'SCHOOL') {
        return targetUrl;
    }

    // SCHOOL MODE: Encrypt and return proxy path
    const encryptedHash = uvEncode(targetUrl);
    
    // Ensure clean base URL
    const cleanBase = DOGE_BASE_URL.endsWith('/') ? DOGE_BASE_URL.slice(0, -1) : DOGE_BASE_URL;
    
    // Return: https://wintonswebsiteproxy.onrender.com/uv/service/[hash]
    return `${cleanBase}${PROXY_PREFIX}${encryptedHash}`;
}
