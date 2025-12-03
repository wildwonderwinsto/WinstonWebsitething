export const DOGE_BASE_URL = "https://wintonswebsiteproxy.onrender.com";

// Standard Ultraviolet (UV) prefix
const PROXY_PREFIX = "/uv/service/"; 

/**
 * Encodes the URL using standard URI encoding.
 * 
 * This triggers the backend's failsafe decoder:
 * "if (h < 2 || h % 2) return decodeURIComponent(s);"
 * 
 * This bypasses the dynamic key mismatch issues that cause the "Whoops!" loop.
 */
function uvEncode(url: string): string {
  if (!url) return url;
  return encodeURIComponent(url);
}

export function transport(targetUrl: string, mode: "HOME" | "SCHOOL" | "LOCKED"): string {
  if (mode === 'HOME' || mode === 'LOCKED') {
    return targetUrl;
  }

  // SCHOOL MODE: Return base URL directly (No wrapping/Deep linking)
  return DOGE_BASE_URL;
}