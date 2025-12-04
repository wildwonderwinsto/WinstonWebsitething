export const DOGE_BASE_URL = "https://wintonswebsiteproxy.onrender.com";
const PROXY_PREFIX = "/uv/service/";
const PROXY_HOSTNAME = "wintonswebsiteproxy.onrender.com";

/**
 * GENERATE THE KEY (k)
 * Logic: Base64(Date + Host) -> Reverse -> Remove first 6 chars -> XOR Key
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
 * ENCODE FUNCTION (Inverse of decodeDoge)
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
 * MAIN TRANSPORT FUNCTION
 */
export function transport(targetUrl: string, mode: "HOME" | "SCHOOL" | "LOCKED" | string): string {
    if (!targetUrl) return '';

    // If not SCHOOL mode, return original URL (Direct Link)
    if (mode !== 'SCHOOL') {
        return targetUrl;
    }

    // SCHOOL MODE: Encrypt and create proper proxy URL
    const encryptedHash = uvEncode(targetUrl);
    const cleanBase = DOGE_BASE_URL.replace(/\/$/, ""); 

    // Return the encoded service URL
    return `${cleanBase}${PROXY_PREFIX}${encryptedHash}`;
}