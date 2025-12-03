export const DOGE_BASE_URL = "https://wintonswebsiteproxy.onrender.com";

// Standard Ultraviolet (UV) prefix confirmed by your config
const PROXY_PREFIX = "/uv/service/"; 

/**
 * Encodes the URL using standard URI encoding.
 * 
 * WHY THIS WORKS:
 * Your backend's uv.config.js has a failsafe:
 * "if (h < 2 || h % 2) return decodeURIComponent(s);"
 * 
 * By sending a standard encoded string (which is not valid Hex for the XOR logic),
 * we force the server to fall back to simple decoding. 
 * This bypasses the Date/Hostname key mismatch issues entirely.
 */
function uvEncode(url: string): string {
  if (!url) return url;
  return encodeURIComponent(url);
}

export function transport(targetUrl: string, mode: "HOME" | "SCHOOL" | "LOCKED"): string {
  if (mode === 'HOME' || mode === 'LOCKED') {
    return targetUrl;
  }

  // SCHOOL MODE: Wrap in Doge/UV Proxy using Fallback Encoding
  const encodedTarget = uvEncode(targetUrl);
  
  // Ensure clean joining of URL parts (remove trailing slash from base if present)
  const cleanBase = DOGE_BASE_URL.endsWith('/') ? DOGE_BASE_URL.slice(0, -1) : DOGE_BASE_URL;
  
  return `${cleanBase}${PROXY_PREFIX}${encodedTarget}`;
}