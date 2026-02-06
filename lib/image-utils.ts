/**
 * Image utilities for handling image loading and validation
 */

export const PLACEHOLDER_IMAGE = "/placeholder.svg";

/**
 * Validate if an image URL is valid and from a trusted source
 */
export function isValidImageUrl(url: string | null | undefined): url is string {
  if (!url || typeof url !== "string") return false;
  
  try {
    const urlObj = new URL(url);
    // Only allow HTTPS
    if (urlObj.protocol !== "https:") return false;
    
    // Whitelist of trusted image sources
    const trustedDomains = [
      "inaturalist.org",
      "cloudinary.net",
      "staticflickr.com",
      "upload.wikimedia.org",
    ];
    
    return trustedDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Get a safe image URL, with fallback to placeholder
 */
export function getSafeImageUrl(url: string | null | undefined): string {
  return isValidImageUrl(url) ? url : PLACEHOLDER_IMAGE;
}

/**
 * Preload an image to validate it can be loaded
 * Returns true if image loads successfully, false otherwise
 */
export async function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}
