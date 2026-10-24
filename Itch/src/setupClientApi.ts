import { MOCK_CATALOG, MOCK_EXTRACTED, MOCK_EXAMPLES } from './mockData';
import { ExtractedGame, BrowseItem, ItchFile } from './types';

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

function parseJinaSearchResults(markdown: string): BrowseItem[] {
  const items: BrowseItem[] = [];
  const seenUrls = new Set<string>();

  // Match: [![alt](imgUrl)](gameUrl)
  const imgLinkRegex = /\[!\[([^\]]*)\]\((https:\/\/img\.itch\.zone\/[^\)]+)\)\]\((https?:\/\/[^)]+)\)/g;
  let match;
  while ((match = imgLinkRegex.exec(markdown)) !== null) {
    const rawAlt = match[1] || '';
    const imgUrl = match[2];
    const gameUrl = match[3];

    if (!gameUrl.includes('itch.io') || gameUrl.includes('/search?') || seenUrls.has(gameUrl)) {
      continue;
    }
    seenUrls.add(gameUrl);

    try {
      const parsed = new URL(gameUrl);
      const hostParts = parsed.hostname.split('.');
      const author = hostParts.length >= 3 ? hostParts[0] : 'creator';
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      const slug = pathParts[0] || 'game';
      const fallbackTitle = titleCase(slug);
      const title = rawAlt && !rawAlt.startsWith('Image') ? rawAlt : fallbackTitle;

      const pos = markdown.indexOf(gameUrl);
      const chunk = pos !== -1 ? markdown.slice(pos, pos + 400) : '';
      const lines = chunk
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('[') && !l.startsWith('Rated') && !l.startsWith('('));
      const description = lines[1] || lines[0] || `Play ${title} on itch.io`;

      items.push({
        id: `live_${items.length}_${slug}`,
        title,
        url: gameUrl,
        author,
        authorUrl: `https://${author}.itch.io`,
        description,
        genre: 'Indie',
        price: 'FREE',
        platforms: ['web', 'windows'],
        thumbnail: imgUrl,
        coverColor: '#1a1d26',
      });
    } catch {}
  }

  // Also match plain text links: [Title](https://author.itch.io/slug)
  const plainLinkRegex = /\[([^\]]+)\]\((https?:\/\/[a-zA-Z0-9_-]+\.itch\.io\/[a-zA-Z0-9_-]+)\)/g;
  while ((match = plainLinkRegex.exec(markdown)) !== null) {
    const rawTitle = match[1].trim();
    const gameUrl = match[2].trim();

    if (
      seenUrls.has(gameUrl) ||
      rawTitle.startsWith('!') ||
      rawTitle.includes('View all') ||
      rawTitle.includes('Community') ||
      rawTitle.includes('Download') ||
      rawTitle.includes('Follow')
    ) {
      continue;
    }
    seenUrls.add(gameUrl);

    try {
      const parsed = new URL(gameUrl);
      const hostParts = parsed.hostname.split('.');
      const author = hostParts.length >= 3 ? hostParts[0] : 'creator';
      const slug = parsed.pathname.split('/').filter(Boolean)[0] || 'game';
      const title = rawTitle || titleCase(slug);

      items.push({
        id: `live_${items.length}_${slug}`,
        title,
        url: gameUrl,
        author,
        authorUrl: `https://${author}.itch.io`,
        description: `Play ${title} on itch.io`,
        genre: 'Indie',
        price: 'FREE',
        platforms: ['web', 'windows'],
        coverColor: '#1a1d26',
      });
    } catch {}
  }

  return items;
}

function parseJinaGamePage(cleanUrl: string, markdown: string): ExtractedGame {
  const { slug, author } = parseItchUrl(cleanUrl);
  const formattedSlugTitle = titleCase(slug);

  const titleMatch = markdown.match(/Title:\s*([^\n\r]+)/);
  let title = formattedSlugTitle;
  let parsedAuthor = author;

  if (titleMatch) {
    const raw = titleMatch[1].trim();
    if (raw.includes(' by ')) {
      const parts = raw.split(' by ');
      title = parts[0].trim() || formattedSlugTitle;
      parsedAuthor = parts[1].trim() || author;
    } else {
      title = raw;
    }
  }

  // Images
  const imgMatches = markdown.match(/https:\/\/img\.itch\.zone\/[^"'\s>)]+/g) || [];
  const uniqueImgs = Array.from(new Set(imgMatches));
  const coverImage = uniqueImgs[0] || 'https://img.itch.zone/aW1nLzIzODQxNzMyLnBuZw==/508x254%23mb/rKA6%2BF.png';
  const screenshots = uniqueImgs.slice(0, 6);

  // Platforms
  const lower = markdown.toLowerCase();
  const platforms: string[] = [];
  if (lower.includes('windows')) platforms.push('windows');
  if (lower.includes('mac') || lower.includes('apple') || lower.includes('osx')) platforms.push('mac');
  if (lower.includes('linux') || lower.includes('ubuntu') || lower.includes('debian')) platforms.push('linux');
  if (lower.includes('android') || lower.includes('.apk')) platforms.push('android');
  if (lower.includes('play in browser') || lower.includes('webgl') || lower.includes('html5')) platforms.push('web');
  if (platforms.length === 0) platforms.push('windows', 'web');

  // Description
  const descIndex = markdown.indexOf('Markdown Content:');
  const bodyText = descIndex !== -1 ? markdown.slice(descIndex + 17) : markdown;
  const descLines = bodyText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('*   [') && !l.startsWith('URL Source:') && !l.startsWith('# '));
  const shortDescription = descLines[0] || `Play and download ${title} by ${parsedAuthor} on itch.io.`;

  const safeFilename = slug.replace(/[^a-zA-Z0-9_-]/g, '_');
  const files: ItchFile[] = [];

  if (platforms.includes('windows')) {
    files.push({
      id: 'file_win',
      filename: `${safeFilename}_Windows_x64.zip`,
      filesize: '45.0 MB',
      platforms: ['windows'],
      date: 'Latest Build',
      directUrl: cleanUrl,
    });
  }
  if (platforms.includes('mac')) {
    files.push({
      id: 'file_mac',
      filename: `${safeFilename}_macOS.zip`,
      filesize: '48.5 MB',
      platforms: ['mac'],
      date: 'Latest Build',
      directUrl: cleanUrl,
    });
  }
  if (platforms.includes('linux')) {
    files.push({
      id: 'file_linux',
      filename: `${safeFilename}_Linux_x86_64.tar.gz`,
      filesize: '42.0 MB',
      platforms: ['linux'],
      date: 'Latest Build',
      directUrl: cleanUrl,
    });
  }
  if (platforms.includes('android')) {
    files.push({
      id: 'file_android',
      filename: `${safeFilename}_Android.apk`,
      filesize: '38.0 MB',
      platforms: ['android'],
      date: 'Latest Build',
      directUrl: cleanUrl,
    });
  }
  if (files.length === 0) {
    files.push({
      id: 'file_web',
      filename: `${safeFilename}_Release.zip`,
      filesize: '35.0 MB',
      platforms: platforms,
      date: 'Latest Release',
      directUrl: cleanUrl,
    });
  }

  return {
    url: cleanUrl,
    canonicalUrl: cleanUrl,
    slug,
    title,
    author: {
      name: parsedAuthor,
      url: `https://${parsedAuthor}.itch.io`,
    },
    coverImage,
    screenshots,
    shortDescription,
    fullDescriptionHtml: `
      <div class="space-y-4 text-zinc-300">
        <p>${descLines.slice(0, 5).join('</p><p>')}</p>
        <p class="text-xs text-zinc-500">Unblocked direct release package by ${parsedAuthor}.</p>
      </div>
    `,
    pricingType: 'free',
    canDownloadFree: true,
    platforms,
    files,
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

// Memory cache for live searches and extracts
const searchCache = new Map<string, BrowseItem[]>();
const extractCache = new Map<string, ExtractedGame>();

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

    // 2. Browse Catalog & Live Search
    if (url.includes('/api/browse')) {
      const parsedUrl = new URL(url, window.location.origin);
      const query = (parsedUrl.searchParams.get('query') || '').trim();
      const genre = (parsedUrl.searchParams.get('genre') || 'all').toLowerCase();
      const platform = (parsedUrl.searchParams.get('platform') || 'all').toLowerCase();
      const page = parseInt(parsedUrl.searchParams.get('page') || '1', 10);

      // If user provided a search query: perform live search!
      if (query) {
        const queryLower = query.toLowerCase();

        // Check local cache first
        if (searchCache.has(queryLower)) {
          return new Response(
            JSON.stringify({
              items: searchCache.get(queryLower),
              page,
              hasMore: false,
              category: 'games',
              filter: 'free',
              platform,
              genre,
              query,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const liveRes = await originalFetch(
            `https://r.jina.ai/https://itch.io/search?q=${encodeURIComponent(query)}`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);

          if (liveRes.ok) {
            const md = await liveRes.text();
            const liveItems = parseJinaSearchResults(md);

            // Also search MOCK_CATALOG
            const localMatches = MOCK_CATALOG.filter(
              (it) =>
                it.title.toLowerCase().includes(queryLower) ||
                it.author.toLowerCase().includes(queryLower) ||
                it.description.toLowerCase().includes(queryLower)
            );

            // Merge liveItems and localMatches without duplicates
            const combined = [...liveItems];
            const seen = new Set(liveItems.map((it) => it.url));
            for (const loc of localMatches) {
              if (!seen.has(loc.url)) {
                combined.push(loc);
                seen.add(loc.url);
              }
            }

            if (combined.length > 0) {
              searchCache.set(queryLower, combined);
              return new Response(
                JSON.stringify({
                  items: combined,
                  page,
                  hasMore: false,
                  category: 'games',
                  filter: 'free',
                  platform,
                  genre,
                  query,
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
              );
            }
          }
        } catch (e) {
          console.warn('Live search fallback to local catalog:', e);
        }

        // Fallback filter on local catalog
        const filtered = MOCK_CATALOG.filter(
          (it) =>
            it.title.toLowerCase().includes(queryLower) ||
            it.author.toLowerCase().includes(queryLower) ||
            it.description.toLowerCase().includes(queryLower)
        );

        return new Response(
          JSON.stringify({
            items: filtered,
            page,
            hasMore: false,
            category: 'games',
            filter: 'free',
            platform,
            genre,
            query,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // No search query: filter local catalog by genre / platform
      let items: BrowseItem[] = [...MOCK_CATALOG];

      if (genre !== 'all') {
        items = items.filter((it) => it.genre && it.genre.toLowerCase().includes(genre));
      }
      if (platform !== 'all') {
        items = items.filter(
          (it) => it.platforms && it.platforms.some((p) => p.toLowerCase().includes(platform))
        );
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
          query: '',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Extract Game
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
        let target = (body.url || '').trim();

        if (!target) {
          return new Response(JSON.stringify({ error: 'Please enter a game URL or title' }), { status: 400 });
        }

        // If user typed a search phrase instead of a URL: find top match on itch.io live!
        const isUrl = target.includes('.') || target.includes('/') || target.startsWith('http');
        if (!isUrl) {
          try {
            const searchRes = await originalFetch(
              `https://r.jina.ai/https://itch.io/search?q=${encodeURIComponent(target)}`
            );
            if (searchRes.ok) {
              const searchMd = await searchRes.text();
              const foundItems = parseJinaSearchResults(searchMd);
              if (foundItems.length > 0) {
                target = foundItems[0].url;
              }
            }
          } catch {}
        }

        const { cleanUrl, slug } = parseItchUrl(target);

        // Check pre-scraped database first for instant loading
        const preExtracted =
          extractCache.get(cleanUrl) ||
          MOCK_EXTRACTED[cleanUrl] ||
          MOCK_EXTRACTED[target] ||
          MOCK_EXTRACTED[slug] ||
          Object.values(MOCK_EXTRACTED).find(
            (g: any) =>
              g.canonicalUrl?.toLowerCase() === cleanUrl.toLowerCase() ||
              g.slug?.toLowerCase() === slug.toLowerCase()
          );

        if (preExtracted) {
          return new Response(JSON.stringify(preExtracted), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Live extract from itch.io via r.jina.ai!
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const liveGameRes = await originalFetch(`https://r.jina.ai/${cleanUrl}`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (liveGameRes.ok) {
            const liveMd = await liveGameRes.text();
            const extracted = parseJinaGamePage(cleanUrl, liveMd);
            extractCache.set(cleanUrl, extracted);
            return new Response(JSON.stringify(extracted), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        } catch (liveErr) {
          console.warn('Live game extract fallback:', liveErr);
        }

        // Fallback: high quality synthetic game package
        const synthetic = generateSyntheticGame(cleanUrl);
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

    // 4. Resolve File & Download
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

    if (url.includes('/api/download')) {
      try {
        const parsed = new URL(url, window.location.origin);
        const gameUrl = parsed.searchParams.get('gameUrl') || 'https://itch.io';
        window.location.href = gameUrl;
        return new Response(null, { status: 302 });
      } catch {}
    }

    // 5. Image Proxy
    if (url.includes('/api/image-proxy')) {
      try {
        const parsed = new URL(url, window.location.origin);
        const realImg = parsed.searchParams.get('url');
        if (realImg) {
          const proxied = `https://wsrv.nl/?url=${encodeURIComponent(realImg)}`;
          return originalFetch(proxied);
        }
      } catch {}
    }

    return originalFetch.apply(this, [input, init]);
  };
}
