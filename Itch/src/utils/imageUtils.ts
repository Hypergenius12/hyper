/**
 * Resolves an image URL through the server-side image proxy
 * to bypass CORS, strict Referer policies, and iframe cross-origin restrictions.
 */
export function getProxiedImageUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('/api/image-proxy')) {
    return url;
  }
  let target = url;
  if (target.startsWith('//')) {
    target = 'https:' + target;
  }
  return `/api/image-proxy?url=${encodeURIComponent(target)}`;
}
