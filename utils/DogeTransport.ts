export const DOGE_BASE_URL = "https://wintonswebsiteproxy.onrender.com";

// Standard Ultraviolet (UV) prefix confirmed by your config
const PROXY_PREFIX = "/uv/service/"; 

// The hostname of the proxy server (Render)
const PROXY_HOSTNAME = "wintonswebsiteproxy.onrender.com";

/**
 * Generates the dynamic key based on the UV config logic:
 * k = new TextEncoder().encode(btoa(new Date().toISOString().slice(0, 10) + location.host).split('').reverse().join('').slice(6.7));
 */
function getDynamicKey(): Uint8Array {
  // 1. Get UTC Date (YYYY-MM-DD)
  const date = new Date().toISOString().slice(0, 10);
  
  // 2. Construct Base String (Date + Host)
  const base = date + PROXY_HOSTNAME;
  
  // 3. Base64 Encode -> Split -> Reverse -> Join -> Slice(6)
  // Note: .slice(6.7) behaves as .slice(6) in JavaScript
  const rawKey = btoa(base).split('').reverse().join('').slice(6);
  
  // 4. Encode to Bytes
  return new TextEncoder().encode(rawKey);
}

/**
 * Encodes the URL using the UV XOR logic + Hex conversion
 */
function uvEncode(url: string): string {
  if (!url) return url;
  
  try {
    const k = getDynamicKey();
    const d = new TextEncoder().encode(url);
    const o = new Uint8Array(d.length);
    
    // XOR Loop using k[i % 8] as specified in your config
    for (let i = 0; i < d.length; i++) {
      o[i] = d[i] ^ k[i % 8];
    }
    
    // Convert to Hex String
    return Array.from(o, (b) => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    console.error("Encoding failed", e);
    return encodeURIComponent(url); // Fallback
  }
}

export function transport(targetUrl: string, mode: "HOME" | "SCHOOL" | "LOCKED"): string {
  if (mode === 'HOME' || mode === 'LOCKED') {
    return targetUrl;
  }

  // SCHOOL MODE: Wrap in Doge/UV Proxy using specific Hex Encoding
  const encodedTarget = uvEncode(targetUrl);
  
  // Ensure clean joining of URL parts (remove trailing slash from base if present)
  const cleanBase = DOGE_BASE_URL.endsWith('/') ? DOGE_BASE_URL.slice(0, -1) : DOGE_BASE_URL;
  
  return `${cleanBase}${PROXY_PREFIX}${encodedTarget}`;
}