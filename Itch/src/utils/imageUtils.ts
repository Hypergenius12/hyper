/**
 * Resolves an image URL through an unblocked, high-performance image CDN proxy (wsrv.nl)
 * to bypass school/firewall blocks (e.g. iboss/Securly blocking img.itch.zone directly)
 * and prevent CORS / 404 proxy errors on static hosting.
 */
export function getProxiedImageUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  let target = url.trim();
  if (target.startsWith('//')) {
    target = 'https:' + target;
  }
  if (target.includes('/api/image-proxy?url=')) {
    try {
      const idx = target.indexOf('url=');
      if (idx !== -1) {
        target = decodeURIComponent(target.slice(idx + 4));
      }
    } catch {}
  }

  // Already proxied via an unblocked image CDN
  if (target.includes('wsrv.nl') || target.includes('images.weserv.nl')) {
    return target;
  }

  // Route any external image (especially img.itch.zone) through wsrv.nl
  if (target.startsWith('http://') || target.startsWith('https://')) {
    return `https://wsrv.nl/?url=${encodeURIComponent(target)}`;
  }

  return target;
}
