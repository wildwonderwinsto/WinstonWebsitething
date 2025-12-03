export const DOGE_BASE_URL = "https://wintonswebsiteproxy.onrender.com";
const PROXY_PREFIX = "/uv/service/";
const PROXY_HOSTNAME = "wintonswebsiteproxy.onrender.com";

function getDailyKey(): Uint8Array {
    // 1. Get current date (UTC)
    const date = new Date().toISOString().slice(0, 10);
    
    // 2. Concatenate Date + Host
    const rawInput = date + PROXY_HOSTNAME;
    
    // 3. Base64 Encode (Standard browser function)
    // No Buffer fallback needed for simple strings like this
    const b64 = btoa(rawInput);
    
    // 4. Reverse
    const reversed = b64.split('').reverse().join('');
    
    // 5. Remove first 6 chars
    const keyString = reversed.slice(6);
    
    // 6. Return as Bytes
    return new TextEncoder().encode(keyString);
}

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
        // Fallback: Just return encoded URI so it doesn't crash, 
        // though the proxy might not accept it without the hex.
        return encodeURIComponent(url); 
    }
}

export function transport(targetUrl: string, mode: "HOME" | "SCHOOL" | "LOCKED" | string): string {
    if (mode !== 'SCHOOL') return targetUrl;

    const encryptedHash = uvEncode(targetUrl);
    
    // Remove trailing slash from base
    const cleanBase = DOGE_BASE_URL.replace(/\/$/, ""); 

    // Point to the loader, using the hash (#) to pass the data
    return `${cleanBase}/loader.html#${encryptedHash}`;
}