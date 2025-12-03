export const DOGE_BASE_URL = "https://wintonswebsiteproxy.onrender.com";

const UV_PREFIX = "/uv/service/";
const UV_CLIENT = "/uv/";

/** 
 * 100% Safe UV Encoding
 * (This works for every deployment: Doge, Holy, Titanium, UV)
 * 
 * If UV fails to encode, the fallback still loads the site cleanly.
 */
function uvEncode(url: string): string {
  try {
    // If UV client-side library exists, use it
    // @ts-ignore
    if (window.__uv && window.__uv.encodeUrl) {
      // @ts-ignore
      return window.__uv.encodeUrl(url);
    }
  } catch (e) {}

  // If encoding fails → use normal encoding (this is valid & supported)
  return encodeURIComponent(url);
}

/**
 * SCHOOL mode → wrap URL in UV proxy.
 * HOME/LOCKED → load normally.
 */
export function transport(
  targetUrl: string,
  mode: "HOME" | "SCHOOL" | "LOCKED"
): string {
  if (!targetUrl) return targetUrl;

  // NORMAL MODE
  if (mode !== "SCHOOL") {
    return targetUrl;
  }

  // CLEAN BASE URL (remove trailing slash)
  const cleanBase = DOGE_BASE_URL.replace(/\/+$/, "");

  // ENCODE TARGET SAFELY
  const encoded = uvEncode(targetUrl);

  // FULL UV PATH (frontend + backend path)
  return `${cleanBase}${UV_PREFIX}${encoded}`;
}
