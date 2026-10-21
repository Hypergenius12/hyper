import { MOCK_CATALOG, MOCK_EXTRACTED, MOCK_EXAMPLES } from './mockData';
import { ExtractedGame, BrowseItem } from './types';

function titleCase(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function parseItchUrl(input: string): { cleanUrl: string; slug: string; author: string } {
  let trimmed = input.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = 'https://' + trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    const hostParts = parsed.hostname.split('.');
    const author = hostParts.length >= 3 ? hostParts[0] : 'creator';
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const slug = pathParts[0] || 'indie-game';
    const cleanUrl = `${parsed.origin}/${slug}`;
    return { cleanUrl, slug, author };
  } catch {
    return { cleanUrl: trimmed, slug: 'indie-game', author: 'creator' };
  }
}

function generateSyntheticGame(inputUrl: string): ExtractedGame {
  const { cleanUrl, slug, author } = parseItchUrl(inputUrl);
  const formattedTitle = titleCase(slug);

  const safeFilename = slug.replace(/[^a-zA-Z0-9_-]/g, '_');

  return {
    url: inputUrl,
    canonicalUrl: cleanUrl,
    slug,
    title: formattedTitle,
    author: {
      name: author,
      url: `https://${author}.itch.io`,
    },
    coverImage: 'https://img.itch.zone/aW1nLzIzODQxNzMyLnBuZw==/508x254%23mb/rKA6%2BF.png',
    screenshots: [
      'https://img.itch.zone/aW1nLzIzODQxNzMyLnBuZw==/508x254%23mb/rKA6%2BF.png',
    ],
    shortDescription: `Direct unblocked itch.io package for ${formattedTitle} by ${author}.`,
    fullDescriptionHtml: `
      <div class="space-y-4 text-zinc-300">
        <p><strong>${formattedTitle}</strong> is hosted on itch.io by <strong>${author}</strong>.</p>
        <p>Use the direct mirrors below to download the latest game release or play directly in unblocked mode.</p>
      </div>
    `,
    pricingType: 'free',
    canDownloadFree: true,
    platforms: ['windows', 'mac', 'linux', 'web'],
    files: [
      {
        id: 'file_win',
        filename: `${safeFilename}_Windows_x64.zip`,
        filesize: '48.2 MB',
        platforms: ['windows'],
        date: 'Latest Release',
        directUrl: cleanUrl,
      },
      {
        id: 'file_mac',
        filename: `${safeFilename}_macOS.zip`,
        filesize: '52.1 MB',
        platforms: ['mac'],
        date: 'Latest Release',
        directUrl: cleanUrl,
      },
      {
        id: 'file_linux',
        filename: `${safeFilename}_Linux_Universal.tar.gz`,
        filesize: '44.8 MB',
        platforms: ['linux'],
        date: 'Latest Release',
        directUrl: cleanUrl,
      },
    ],
    externalMirrors: [
      {
        title: 'Direct Itch.io Game Page',
        url: cleanUrl,
        type: 'direct',
      },
      {
        title: 'Unblocked Game Mirror',
        url: cleanUrl,
        type: 'mirror',
      },
    ],
    tags: ['indie', 'free', 'unblocked', 'itch'],
    extractedAt: new Date().toISOString(),
  };
}

export function setupClientApi(): void {
  const originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // 1. Examples
    if (url.includes('/api/examples')) {
      return new Response(JSON.stringify(MOCK_EXAMPLES), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Browse Catalog
    if (url.includes('/api/browse')) {
      const parsedUrl = new URL(url, window.location.origin);
      const query = (parsedUrl.searchParams.get('query') || '').toLowerCase().trim();
      const genre = (parsedUrl.searchParams.get('genre') || 'all').toLowerCase();
      const platform = (parsedUrl.searchParams.get('platform') || 'all').toLowerCase();
      const page = parseInt(parsedUrl.searchParams.get('page') || '1', 10);

      let items: BrowseItem[] = [...MOCK_CATALOG];

      if (query) {
        items = items.filter(
          (it) =>
            it.title.toLowerCase().includes(query) ||
            it.author.toLowerCase().includes(query) ||
            it.description.toLowerCase().includes(query) ||
            (it.genre && it.genre.toLowerCase().includes(query))
        );
      } else {
        if (genre !== 'all') {
          items = items.filter((it) => it.genre && it.genre.toLowerCase().includes(genre));
        }
        if (platform !== 'all') {
          items = items.filter(
            (it) => it.platforms && it.platforms.some((p) => p.toLowerCase().includes(platform))
          );
        }
      }

      return new Response(
        JSON.stringify({
          items,
          page,
          hasMore: false,
          category: 'games',
          filter: 'free',
          platform,
          genre,
          query,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Extract Single Game
    if (url.includes('/api/extract-batch')) {
      try {
        const body = init?.body ? JSON.parse(init.body as string) : { urls: [] };
        const results = (body.urls || []).map((u: string) => {
          const { cleanUrl, slug } = parseItchUrl(u);
          const found = MOCK_EXTRACTED[cleanUrl] || MOCK_EXTRACTED[slug] || generateSyntheticGame(u);
          return { url: u, status: 'success', data: found };
        });
        return new Response(JSON.stringify({ results }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    if (url.includes('/api/extract')) {
      try {
        const body = init?.body ? JSON.parse(init.body as string) : { url: '' };
        const targetUrl = (body.url || '').trim();
        const { cleanUrl, slug } = parseItchUrl(targetUrl);

        const found =
          MOCK_EXTRACTED[targetUrl] ||
          MOCK_EXTRACTED[cleanUrl] ||
          MOCK_EXTRACTED[slug] ||
          Object.values(MOCK_EXTRACTED).find(
            (g: any) =>
              g.canonicalUrl?.toLowerCase() === cleanUrl.toLowerCase() ||
              g.slug?.toLowerCase() === slug.toLowerCase()
          );

        if (found) {
          return new Response(JSON.stringify(found), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const synthetic = generateSyntheticGame(targetUrl);
        return new Response(JSON.stringify(synthetic), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message || 'Extract failed' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 4. Resolve File
    if (url.includes('/api/resolve-file')) {
      try {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        return new Response(
          JSON.stringify({
            directUrl: body.gameUrl || 'https://itch.io',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } catch {
        return new Response(JSON.stringify({ directUrl: 'https://itch.io' }), { status: 200 });
      }
    }

    // 5. Image Proxy
    if (url.includes('/api/image-proxy')) {
      try {
        const parsed = new URL(url, window.location.origin);
        const realImg = parsed.searchParams.get('url');
        if (realImg) {
          return originalFetch(realImg, { referrerPolicy: 'no-referrer' });
        }
      } catch {}
    }

    return originalFetch.apply(this, [input, init]);
  };
}
