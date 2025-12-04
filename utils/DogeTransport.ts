export const DOGE_BASE_URL = "https://wintonswebsiteproxy.onrender.com";
const PROXY_PREFIX = "/uv/service/";
const PROXY_HOSTNAME = "wintonswebsiteproxy.onrender.com";

function getDailyKey(): Uint8Array {
    const date = new Date().toISOString().slice(0, 10);
    const rawInput = date + PROXY_HOSTNAME;
    const b64 = btoa(rawInput);
    const reversed = b64.split('').reverse().join('');
    const keyString = reversed.slice(6);
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
    if (mode !== 'SCHOOL') {
        return targetUrl || '';
    }

    // SCHOOL MODE: Return base URL directly.
    return DOGE_BASE_URL;
}