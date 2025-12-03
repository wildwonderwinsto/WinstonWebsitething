// The static proxy page requested by the user
export const DOGE_PROXY_URL = "https://wintonswebsiteproxy.onrender.com/indev";

/**
 * Transport Logic
 * 
 * SCHOOL MODE:
 * Returns the static proxy URL (https://wintonswebsiteproxy.onrender.com/indev)
 * directly, as requested. It does not attempt to encode or wrap the specific
 * movie URL.
 * 
 * HOME/LOCKED MODE:
 * Returns the raw target URL for direct playback.
 */
export function transport(
  targetUrl: string,
  mode: "HOME" | "SCHOOL" | "LOCKED"
): string {
  if (mode === "SCHOOL") {
    return DOGE_PROXY_URL;
  }

  return targetUrl;
}