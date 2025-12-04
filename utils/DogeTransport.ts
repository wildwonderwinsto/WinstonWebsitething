export const DOGE_BASE_URL = "https://wintonswebsiteproxy.onrender.com";
const PROXY_PREFIX = "/uv/service/";
const PROXY_HOSTNAME = "wintonswebsiteproxy.onrender.com";

function getDailyKey(): Uint8Array {
    // 1. Get current date (UTC)
    const date = new Date().toISOString().slice(0, 10);
    
    // 2. Concatenate Date + Host
    const rawInput = date + PROXY_HOSTNAME;
    
    // 3. Base64 Encode
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
        return encodeURIComponent(url); 
    }
}

export function transport(targetUrl: string, mode: "HOME" | "SCHOOL" | "LOCKED" | string): string {
    if (!targetUrl) return '';

    // If not SCHOOL mode, return original URL
    if (mode !== 'SCHOOL') {
        return targetUrl;
    }

    // SCHOOL MODE: Return Base URL directly
    return DOGE_BASE_URL;
}