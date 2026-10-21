/**
 * Resolves an image URL directly with no-referrer
 * to bypass CORS and avoid 404 proxy errors on static hosting.
 */
export function getProxiedImageUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('data:')) {
    return url;
  }
  let target = url;
  if (target.startsWith('//')) {
    target = 'https:' + target;
  }
  if (target.includes('/api/image-proxy?url=')) {
    try {
      const idx = target.indexOf('url=');
      if (idx !== -1) {
        return decodeURIComponent(target.slice(idx + 4));
      }
    } catch {}
  }
  return target;
}
