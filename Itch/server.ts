import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import * as cheerio from 'cheerio';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

interface ItchFile {
  id: string;
  uploadId?: string;
  filename: string;
  filesize: string;
  platforms: string[];
  date?: string;
  directUrl?: string;
  external?: boolean;
}

interface ExternalMirror {
  title: string;
  url: string;
  type: string;
}

interface ItchComment {
  id: string;
  author: {
    name: string;
    url?: string;
    avatar?: string;
  };
  date: string;
  timestamp?: string;
  body: string;
  bodyHtml?: string;
  votes?: string;
  isReply?: boolean;
}

interface ExtractedGame {
  url: string;
  canonicalUrl: string;
  slug: string;
  title: string;
  author: {
    name: string;
    url?: string;
    avatar?: string;
  };
  coverImage?: string;
  screenshots: string[];
  shortDescription?: string;
  fullDescriptionHtml?: string;
  pricingType: 'free' | 'pwyw' | 'paid' | 'unknown';
  priceText?: string;
  canDownloadFree: boolean;
  requiresPaymentMessage?: string;
  platforms: string[];
  webGameUrl?: string;
  files: ItchFile[];
  externalMirrors: ExternalMirror[];
  rating?: {
    average?: number;
    count?: number;
  };
  tags: string[];
  comments?: ItchComment[];
  extractedAt: string;
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Helper to normalize input URL
function normalizeItchUrl(input: string): { original: string; cleanUrl: string; slug: string; origin: string } {
  let trimmed = input.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = 'https://' + trimmed;
  }
  const parsed = new URL(trimmed);
  // remove trailing purchase or download paths if present for initial metadata fetch
  const pathParts = parsed.pathname.split('/').filter(Boolean);
  let slug = pathParts[0] || '';
  if (slug === 'games' && pathParts[1]) {
    slug = pathParts[1];
  }
  
  // Base clean game URL
  const cleanUrl = `${parsed.origin}/${slug}`;
  return {
    original: trimmed,
    cleanUrl,
    slug,
    origin: parsed.origin,
  };
}

// Scrape itch.io game details & download links
async function scrapeItchGame(inputUrl: string): Promise<ExtractedGame> {
  const { cleanUrl, slug, origin } = normalizeItchUrl(inputUrl);

  const mainRes = await fetch(cleanUrl, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!mainRes.ok) {
    if (mainRes.status === 404) {
      throw new Error(`Game not found (404) at ${cleanUrl}. Check the URL and try again.`);
    }
    throw new Error(`Failed to fetch page from itch.io (HTTP ${mainRes.status})`);
  }

  const mainHtml = await mainRes.text();
  const $ = cheerio.load(mainHtml);
  const cookies = mainRes.headers.get('set-cookie') || '';

  // Extract CSRF token
  const csrfMatch = mainHtml.match(/meta\s+name="csrf_token"\s+value="([^"]+)"/);
  const csrf = csrfMatch ? csrfMatch[1] : '';

  // Metadata
  const title =
    $('.game_title').text().trim() ||
    $('h1').first().text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().replace(/\s+-\s+itch\.io/i, '').trim() ||
    slug;

  const authorName =
    $('.game_info_panel_widget .game_info_column a[href*="itch.io"]').first().text().trim() ||
    $('.header_user_details .user_name').text().trim() ||
    $('.user_link').first().text().trim() ||
    $('meta[name="twitter:creator"]').attr('content') ||
    '';

  const authorUrl =
    $('.game_info_panel_widget .game_info_column a[href*="itch.io"]').first().attr('href') ||
    origin;

  // Clean cover image
  let coverImage =
    $('meta[property="og:image"]').attr('content') ||
    $('.game_cover img, .cover_image img').first().attr('src') ||
    $('.header_image img').first().attr('src') ||
    '';
  if (coverImage.startsWith('//')) {
    coverImage = 'https:' + coverImage;
  }

  const screenshots: string[] = [];
  const seenScreenshotKeys = new Set<string>();

  const screenshotAnchors = $('.screenshot_list a');
  if (screenshotAnchors.length > 0) {
    screenshotAnchors.each((_, el) => {
      let src = $(el).attr('href') || $(el).attr('data-screenshot_url');
      const img = $(el).find('img');
      const screenshotId = img.attr('data-screenshot_id');
      if (!src && img.length > 0) {
        src = img.attr('src') || img.attr('data-lazy_src');
      }
      if (src) {
        if (src.startsWith('//')) src = 'https:' + src;
        // Key for deduplication: screenshotId, or the base64 token in img.itch.zone url, or the URL itself
        const key = screenshotId || (src.includes('img.itch.zone/') ? src.split('/')[4] : src);
        if (key && !seenScreenshotKeys.has(key)) {
          seenScreenshotKeys.add(key);
          screenshots.push(src);
        }
      }
    });
  } else {
    $('.screenshot_list img').each((_, el) => {
      let src = $(el).attr('src') || $(el).attr('data-lazy_src') || $(el).attr('data-screenshot_url');
      if (src) {
        if (src.startsWith('//')) src = 'https:' + src;
        const key = src.includes('img.itch.zone/') ? src.split('/')[4] : src;
        if (key && !seenScreenshotKeys.has(key)) {
          seenScreenshotKeys.add(key);
          screenshots.push(src);
        }
      }
    });
  }

  const shortDescription =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    $('.formatted_description p').first().text().trim() ||
    '';

  // Rewrite images in formatted_description to use same-origin image proxy
  const $desc = $('.formatted_description');
  $desc.find('img').each((_, img) => {
    let src = $(img).attr('src') || $(img).attr('data-src') || '';
    if (src.startsWith('//')) src = 'https:' + src;
    if (src.startsWith('http://') || src.startsWith('https://')) {
      $(img).attr('src', `/api/image-proxy?url=${encodeURIComponent(src)}`);
      $(img).attr('loading', 'lazy');
      $(img).attr('referrerpolicy', 'no-referrer');
    }
  });
  const fullDescriptionHtml = $desc.html() || '';

  // Platform badges
  const platforms = new Set<string>();
  $('.download_platforms .icon, .platform_icons .icon').each((_, el) => {
    const cls = $(el).attr('class') || '';
    if (cls.includes('windows')) platforms.add('windows');
    if (cls.includes('apple') || cls.includes('mac')) platforms.add('mac');
    if (cls.includes('tux') || cls.includes('linux')) platforms.add('linux');
    if (cls.includes('android')) platforms.add('android');
  });

  // Check for web game embed (iframe / HTML5 game)
  let webGameUrl = '';
  const iframePlaceholder = $('.iframe_placeholder[data-iframe]');
  if (iframePlaceholder.length > 0) {
    const iframeHtml = iframePlaceholder.attr('data-iframe') || '';
    const srcMatch = iframeHtml.match(/src="([^"]+)"/);
    if (srcMatch) {
      webGameUrl = srcMatch[1];
      platforms.add('web');
    }
  } else {
    const directIframe = $('iframe#game_drop, iframe[src*="html-classic.itch.zone"]');
    if (directIframe.length > 0) {
      webGameUrl = directIframe.attr('src') || '';
      platforms.add('web');
    }
  }

  // Tags
  const tags: string[] = [];
  $('.game_info_panel_widget a[href*="/tag-"]').each((_, el) => {
    const t = $(el).text().trim();
    if (t && !tags.includes(t)) tags.push(t);
  });

  // Rating
  let ratingAverage: number | undefined;
  let ratingCount: number | undefined;
  const ratingAvgText = $('.aggregate_rating .rating_value, meta[itemprop="ratingValue"]').attr('content') ||
    $('.aggregate_rating .rating_value').text().trim();
  if (ratingAvgText) {
    const parsed = parseFloat(ratingAvgText);
    if (!isNaN(parsed)) ratingAverage = parsed;
  }
  const ratingCountText = $('.aggregate_rating .rating_count, meta[itemprop="ratingCount"]').attr('content') ||
    $('.aggregate_rating .rating_count').text().trim();
  if (ratingCountText) {
    const parsed = parseInt(ratingCountText.replace(/[^\d]/g, ''), 10);
    if (!isNaN(parsed)) ratingCount = parsed;
  }

  // Pricing analysis
  let pricingType: 'free' | 'pwyw' | 'paid' | 'unknown' = 'free';
  let priceText = '';
  const buyBtn = $('.buy_btn, .button.buy_btn');
  const buyBtnText = buyBtn.first().text().trim().toLowerCase();
  if (buyBtnText.includes('buy now') || buyBtnText.includes('$') || buyBtnText.includes('€') || buyBtnText.includes('£')) {
    pricingType = 'paid';
    priceText = buyBtn.first().text().replace(/\s+/g, ' ').trim();
  }

  const downloadBtn = $('.download_btn, a[href*="/purchase"], a[href*="/download"]');
  if (downloadBtn.length > 0) {
    const dlText = downloadBtn.first().text().trim().toLowerCase();
    if (dlText.includes('download now') || dlText.includes('download')) {
      // It might be 100% free or PWYW (Pay what you want)
      if (pricingType === 'paid') {
        pricingType = 'pwyw';
      }
    }
  }

  // Look for external mirrors in description
  const externalMirrors: ExternalMirror[] = [];
  $('.formatted_description a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (
      href.includes('drive.google.com') ||
      href.includes('mega.nz') ||
      href.includes('mediafire.com') ||
      href.includes('dropbox.com') ||
      href.includes('github.com') ||
      href.includes('.zip') ||
      href.includes('.rar') ||
      href.includes('.tar.gz') ||
      href.includes('.exe') ||
      href.includes('.apk')
    ) {
      let type = 'External Mirror';
      if (href.includes('drive.google')) type = 'Google Drive';
      else if (href.includes('mega.nz')) type = 'MEGA';
      else if (href.includes('mediafire')) type = 'MediaFire';
      else if (href.includes('dropbox')) type = 'Dropbox';
      else if (href.includes('github.com')) type = 'GitHub';
      else if (href.includes('.apk')) type = 'Android APK';

      if (!externalMirrors.some((m) => m.url === href)) {
        externalMirrors.push({
          title: text || `${type} Download`,
          url: href,
          type,
        });
      }
    }
  });

  // Attempt to acquire download page & file manifests
  const files: ItchFile[] = [];
  let canDownloadFree = true;
  let requiresPaymentMessage = '';

  // 1. First, try calling /slug/download_url to get the download landing token page
  let downloadLandingUrl = '';
  let downloadCookies = cookies;

  if (csrf && slug) {
    const downloadEndpoint = `${origin}/${slug}/download_url`;
    const body = new URLSearchParams();
    body.set('csrf_token', csrf);

    try {
      const dlUrlRes = await fetch(downloadEndpoint, {
        method: 'POST',
        headers: {
          'User-Agent': USER_AGENT,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookies,
          'Referer': cleanUrl,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: body.toString(),
      });

      const dlJson = (await dlUrlRes.json()) as { url?: string; errors?: string[] };
      if (dlJson.url) {
        downloadLandingUrl = dlJson.url;
        canDownloadFree = true;
      } else if (dlJson.errors && dlJson.errors.length > 0) {
        pricingType = 'paid';
        canDownloadFree = false;
        requiresPaymentMessage = dlJson.errors.join(', ');
      }
    } catch {
      // not a fatal failure, fallback to parsing main page upload widgets
    }
  }

  // 2. If we got a download landing URL, fetch it and parse upload IDs and files!
  let landingCsrf = csrf;
  if (downloadLandingUrl) {
    try {
      const landingRes = await fetch(downloadLandingUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Cookie': downloadCookies,
        },
      });
      const landingHtml = await landingRes.text();
      const $landing = cheerio.load(landingHtml);
      const newCookies = landingRes.headers.get('set-cookie');
      if (newCookies) downloadCookies = newCookies;

      const landingCsrfMatch = landingHtml.match(/meta\s+name="csrf_token"\s+value="([^"]+)"/);
      if (landingCsrfMatch) landingCsrf = landingCsrfMatch[1];

      // Parse each .upload on landing page
      $landing('.upload').each((i, el) => {
        const uploadId =
          $landing(el).find('[data-upload_id]').attr('data-upload_id') ||
          $landing(el).attr('data-upload_id') ||
          $landing(el).find('a.download_btn').attr('data-upload_id') ||
          '';

        const filename =
          $landing(el).find('.name').attr('title') ||
          $landing(el).find('.name').text().trim() ||
          $landing(el).find('.upload_name').text().trim() ||
          `File_${i + 1}`;

        const filesize = $landing(el).find('.file_size').text().trim();
        const date = $landing(el).find('.upload_date abbr').attr('title') || $landing(el).find('.upload_date').text().trim();

        const filePlatforms: string[] = [];
        $landing(el).find('.download_platforms .icon').each((_, icon) => {
          const iconCls = $landing(icon).attr('class') || '';
          if (iconCls.includes('windows')) filePlatforms.push('windows');
          if (iconCls.includes('apple') || iconCls.includes('mac')) filePlatforms.push('mac');
          if (iconCls.includes('tux') || iconCls.includes('linux')) filePlatforms.push('linux');
          if (iconCls.includes('android')) filePlatforms.push('android');
        });

        files.push({
          id: uploadId || `landing_${i}`,
          uploadId: uploadId || undefined,
          filename: filename.replace(/\s+/g, ' '),
          filesize,
          platforms: filePlatforms,
          date,
        });
      });
    } catch (e: any) {
      console.error('Error fetching download landing page:', e.message);
    }
  }

  // 3. If files list is still empty, extract upload widgets directly from the main page
  if (files.length === 0) {
    $('.upload').each((i, el) => {
      const uploadId =
        $(el).attr('data-upload_id') ||
        $(el).find('[data-upload_id]').attr('data-upload_id') ||
        '';

      const filename =
        $(el).find('.name').attr('title') ||
        $(el).find('.name').text().trim() ||
        $(el).find('.upload_name').text().trim() ||
        `File_${i + 1}`;

      const filesize = $(el).find('.file_size').text().trim();
      const date = $(el).find('.upload_date abbr').attr('title') || $(el).find('.upload_date').text().trim();

      const filePlatforms: string[] = [];
      $(el).find('.download_platforms .icon').each((_, icon) => {
        const iconCls = $(icon).attr('class') || '';
        if (iconCls.includes('windows')) filePlatforms.push('windows');
        if (iconCls.includes('apple') || iconCls.includes('mac')) filePlatforms.push('mac');
        if (iconCls.includes('tux') || iconCls.includes('linux')) filePlatforms.push('linux');
        if (iconCls.includes('android')) filePlatforms.push('android');
      });

      files.push({
        id: uploadId || `main_${i}`,
        uploadId: uploadId || undefined,
        filename: filename.replace(/\s+/g, ' '),
        filesize,
        platforms: filePlatforms,
        date,
      });
    });
  }

  // 4. Resolve direct download signed URLs for all uploads that have uploadId
  if (canDownloadFree && files.length > 0) {
    await Promise.all(
      files.map(async (file) => {
        if (!file.uploadId) return;
        try {
          const fileEndpoint = `${origin}/${slug}/file/${file.uploadId}?source=game_download`;
          const fileBody = new URLSearchParams();
          fileBody.set('csrf_token', landingCsrf || csrf);

          const fileRes = await fetch(fileEndpoint, {
            method: 'POST',
            headers: {
              'User-Agent': USER_AGENT,
              'Content-Type': 'application/x-www-form-urlencoded',
              'Cookie': downloadCookies,
              'Referer': downloadLandingUrl || cleanUrl,
              'X-Requested-With': 'XMLHttpRequest',
            },
            body: fileBody.toString(),
          });

          if (fileRes.ok) {
            const fileJson = (await fileRes.json()) as { url?: string; external?: boolean };
            if (fileJson.url) {
              file.directUrl = fileJson.url;
              file.external = !!fileJson.external;
            }
          }
        } catch (err: any) {
          console.warn(`Could not resolve direct URL for upload ${file.uploadId}:`, err.message);
        }
      })
    );
  }

  // Community comments extraction
  const comments: ItchComment[] = [];
  $('.community_post').each((i, el) => {
    const $el = $(el);
    const id = $el.attr('data-post_id') || $el.attr('id') || `comment_${i}`;
    const authorName = $el.find('.post_author a, .post_author').first().text().trim();
    let authorUrl = $el.find('.post_author a').first().attr('href') || undefined;
    if (authorUrl && authorUrl.startsWith('/')) {
      authorUrl = 'https://itch.io' + authorUrl;
    }

    const style = $el.find('.post_avatar').attr('style') || '';
    const avatarMatch = style.match(/url\(([^)]+)\)/);
    let avatar = avatarMatch ? avatarMatch[1].replace(/["\x27]/g, '') : undefined;
    if (avatar) {
      if (avatar.startsWith('//')) avatar = 'https:' + avatar;
      else if (avatar.startsWith('/')) avatar = 'https://itch.io' + avatar;
    }

    const date = $el.find('.post_date a, .post_date').first().text().trim();
    const timestamp = $el.find('.post_date').first().attr('title') || undefined;
    const votes = $el.find('.vote_counts').first().text().trim() || undefined;

    const $body = $el.find('.post_body').first();
    const bodyText = $body.text().trim();

    $body.find('img').each((__, img) => {
      let src = $(img).attr('src') || '';
      if (src.startsWith('//')) src = 'https:' + src;
      if (src.startsWith('http://') || src.startsWith('https://')) {
        $(img).attr('src', `/api/image-proxy?url=${encodeURIComponent(src)}`);
      }
    });
    const bodyHtml = $body.html() || '';
    const isReply = $el.parents('.community_post').length > 0;

    if (authorName && bodyText) {
      comments.push({
        id,
        author: {
          name: authorName,
          url: authorUrl,
          avatar,
        },
        date,
        timestamp,
        body: bodyText,
        bodyHtml,
        votes,
        isReply,
      });
    }
  });

  return {
    url: inputUrl,
    canonicalUrl: cleanUrl,
    slug,
    title,
    author: {
      name: authorName,
      url: authorUrl,
    },
    coverImage: coverImage || undefined,
    screenshots,
    shortDescription,
    fullDescriptionHtml,
    pricingType,
    priceText: priceText || undefined,
    canDownloadFree,
    requiresPaymentMessage: requiresPaymentMessage || undefined,
    platforms: Array.from(platforms),
    webGameUrl: webGameUrl || undefined,
    files,
    externalMirrors,
    rating: ratingAverage ? { average: ratingAverage, count: ratingCount } : undefined,
    tags,
    comments,
    extractedAt: new Date().toISOString(),
  };
}

// API endpoint to resolve a single upload's direct signed download URL on demand
async function resolveDirectUrl(gameUrl: string, uploadId: string): Promise<string> {
  const { cleanUrl, slug, origin } = normalizeItchUrl(gameUrl);

  const mainRes = await fetch(cleanUrl, {
    headers: { 'User-Agent': USER_AGENT },
  });
  const mainHtml = await mainRes.text();
  const cookies = mainRes.headers.get('set-cookie') || '';
  const csrfMatch = mainHtml.match(/meta\s+name="csrf_token"\s+value="([^"]+)"/);
  const csrf = csrfMatch ? csrfMatch[1] : '';

  // Get download token
  const downloadEndpoint = `${origin}/${slug}/download_url`;
  const body = new URLSearchParams();
  body.set('csrf_token', csrf);

  const dlUrlRes = await fetch(downloadEndpoint, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies,
      'Referer': cleanUrl,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: body.toString(),
  });

  const dlJson = (await dlUrlRes.json()) as { url?: string; errors?: string[] };
  if (!dlJson.url) {
    throw new Error(dlJson.errors?.join(', ') || 'Failed to authorize download with itch.io');
  }

  const landingRes = await fetch(dlJson.url, {
    headers: { 'User-Agent': USER_AGENT, 'Cookie': cookies },
  });
  const landingHtml = await landingRes.text();
  const landingCookies = landingRes.headers.get('set-cookie') || cookies;
  const landingCsrfMatch = landingHtml.match(/meta\s+name="csrf_token"\s+value="([^"]+)"/);
  const landingCsrf = landingCsrfMatch ? landingCsrfMatch[1] : csrf;

  const fileEndpoint = `${origin}/${slug}/file/${uploadId}?source=game_download`;
  const fileBody = new URLSearchParams();
  fileBody.set('csrf_token', landingCsrf);

  const fileRes = await fetch(fileEndpoint, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': landingCookies,
      'Referer': dlJson.url,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: fileBody.toString(),
  });

  const fileJson = (await fileRes.json()) as { url?: string; errors?: string[] };
  if (fileJson.url) {
    return fileJson.url;
  }
  throw new Error(fileJson.errors?.join(', ') || 'No download URL returned by itch.io storage');
}

// Routes
app.post('/api/extract', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Please provide a valid itch.io URL' });
      return;
    }
    const result = await scrapeItchGame(url);
    res.json(result);
  } catch (err: any) {
    console.error('Extract error:', err);
    res.status(500).json({ error: err.message || 'Failed to extract download links from itch.io' });
  }
});

app.post('/api/extract-batch', async (req: Request, res: Response) => {
  try {
    const { urls } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
      res.status(400).json({ error: 'Please provide an array of URLs' });
      return;
    }
    const cleanList = urls.filter((u) => typeof u === 'string' && u.trim().length > 0).slice(0, 10);
    const results = await Promise.allSettled(cleanList.map((u) => scrapeItchGame(u)));
    const mapped = results.map((r, i) => {
      if (r.status === 'fulfilled') {
        return { success: true, data: r.value, url: cleanList[i] };
      } else {
        return { success: false, error: r.reason?.message || 'Failed', url: cleanList[i] };
      }
    });
    res.json({ results: mapped });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Batch extraction failed' });
  }
});

// Direct Download link redirector / proxy
app.get('/api/download', async (req: Request, res: Response) => {
  try {
    const gameUrl = req.query.gameUrl as string;
    const uploadId = req.query.uploadId as string;
    const directUrlParam = req.query.directUrl as string;

    if (!gameUrl || !uploadId) {
      if (directUrlParam) {
        res.redirect(302, directUrlParam);
        return;
      }
      res.status(400).send('Missing gameUrl or uploadId parameter');
      return;
    }

    // Generate fresh signed URL
    const freshUrl = await resolveDirectUrl(gameUrl, uploadId);
    res.redirect(302, freshUrl);
  } catch (err: any) {
    console.error('Download redirect error:', err);
    res.status(500).send(`Unable to initiate download: ${err.message}`);
  }
});

// Resolve fresh direct URL
app.post('/api/resolve-file', async (req: Request, res: Response) => {
  try {
    const { gameUrl, uploadId } = req.body;
    if (!gameUrl || !uploadId) {
      res.status(400).json({ error: 'Missing gameUrl or uploadId' });
      return;
    }
    const freshUrl = await resolveDirectUrl(gameUrl, uploadId);
    res.json({ directUrl: freshUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Stream game package into browser memory without CORS issues
app.get('/api/stream-package', async (req: Request, res: Response) => {
  try {
    const gameUrl = req.query.gameUrl as string;
    const uploadId = req.query.uploadId as string;
    if (!gameUrl || !uploadId) {
      res.status(400).json({ error: 'Missing gameUrl or uploadId' });
      return;
    }

    const directUrl = await resolveDirectUrl(gameUrl, uploadId);
    const fetchRes = await fetch(directUrl, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!fetchRes.ok) {
      res.status(fetchRes.status).send('Failed to fetch from itch storage');
      return;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', fetchRes.headers.get('content-type') || 'application/octet-stream');
    const contentLength = fetchRes.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    const buffer = Buffer.from(await fetchRes.arrayBuffer());
    res.send(buffer);
  } catch (err: any) {
    console.error('Stream package error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Same-origin image proxy to bypass CORS, referer blocks, or iframe privacy restrictions
app.get('/api/image-proxy', async (req: Request, res: Response) => {
  try {
    const rawUrl = req.query.url as string;
    if (!rawUrl) {
      res.status(400).send('Missing url parameter');
      return;
    }
    let target = rawUrl;
    if (target.startsWith('//')) {
      target = 'https:' + target;
    }
    const parsed = new URL(target);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      res.status(400).send('Invalid image URL protocol');
      return;
    }

    const imgRes = await fetch(target, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!imgRes.ok) {
      res.status(imgRes.status).send('Failed to fetch image');
      return;
    }

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    res.send(buffer);
  } catch (err: any) {
    res.status(500).send('Error proxying image: ' + err.message);
  }
});

// Catalog browser endpoint to search and scroll through itch.io games and assets
app.get('/api/browse', async (req: Request, res: Response) => {
  try {
    const category = (req.query.category as string) || 'games';
    const filter = (req.query.filter as string) || 'free';
    const platform = (req.query.platform as string) || 'all';
    const genre = (req.query.genre as string) || 'all';
    const sort = (req.query.sort as string) || '';
    const query = (req.query.query as string) || '';
    const page = parseInt((req.query.page as string) || '1', 10);

    let targetUrl: string;
    if (query && query.trim()) {
      targetUrl = `https://itch.io/search?q=${encodeURIComponent(query.trim())}&page=${page}`;
    } else if (genre && genre !== 'all') {
      const sub = filter && filter !== 'all' ? `/${filter}` : '';
      targetUrl = `https://itch.io/games/genre-${genre}${sub}?page=${page}`;
    } else if (platform && platform !== 'all') {
      const sub = filter && filter !== 'all' ? `/${filter}` : '';
      targetUrl = `https://itch.io/${category}/platform-${platform}${sub}?page=${page}`;
    } else if (sort && sort !== 'popular') {
      targetUrl = `https://itch.io/${category}/${sort}?page=${page}`;
    } else if (filter && filter !== 'all') {
      targetUrl = `https://itch.io/${category}/${filter}?page=${page}`;
    } else {
      targetUrl = `https://itch.io/${category}?page=${page}`;
    }

    let fetchRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    // Graceful fallback if itch returns 403 or 404 for an exotic filter combo
    if (!fetchRes.ok && (fetchRes.status === 404 || fetchRes.status === 403)) {
      const fallbackUrl = `https://itch.io/${category}/free?page=${page}`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      if (fallbackRes.ok) {
        fetchRes = fallbackRes;
      } else {
        res.status(fetchRes.status).json({ error: `Failed to fetch catalog from itch.io (HTTP ${fetchRes.status})` });
        return;
      }
    } else if (!fetchRes.ok) {
      res.status(fetchRes.status).json({ error: `Failed to fetch catalog from itch.io (HTTP ${fetchRes.status})` });
      return;
    }

    const html = await fetchRes.text();
    const $ = cheerio.load(html);

    const items: any[] = [];
    $('.game_cell').each((i, el) => {
      const title = $(el).find('.game_title a, .title a').text().trim();
      const rawLink = $(el).find('.game_title a, .title a').attr('href') || '';
      let url = rawLink;
      if (url.startsWith('/')) {
        url = 'https://itch.io' + url;
      }
      const author = $(el).find('.game_author a').text().trim();
      const authorUrl = $(el).find('.game_author a').attr('href') || '';
      const description = $(el).find('.game_text').text().trim();
      const itemGenre = $(el).find('.game_genre').text().trim();
      const price = $(el).find('.price_value').text().trim();

      const imgEl = $(el).find('img');
      let thumbnail = imgEl.attr('data-lazy_src') || imgEl.attr('src') || imgEl.attr('data-screenshot_url') || '';
      if (thumbnail.startsWith('//')) {
        thumbnail = 'https:' + thumbnail;
      }

      const style = $(el).find('.game_thumb').attr('style') || '';
      const colorMatch = style.match(/background-color:\s*(#[0-9a-fA-F]+)/);
      const coverColor = colorMatch ? colorMatch[1] : undefined;

      const platforms: string[] = [];
      $(el).find('.game_platform .icon').each((_, ic) => {
        const cls = $(ic).attr('class') || '';
        if (cls.includes('windows')) platforms.push('windows');
        if (cls.includes('apple') || cls.includes('mac')) platforms.push('mac');
        if (cls.includes('tux') || cls.includes('linux')) platforms.push('linux');
        if (cls.includes('android')) platforms.push('android');
      });

      if (title && url) {
        items.push({
          id: `browse_${page}_${i}`,
          title,
          url,
          author,
          authorUrl: authorUrl || undefined,
          description,
          genre: itemGenre || undefined,
          price: price || undefined,
          platforms,
          thumbnail: thumbnail || undefined,
          coverColor,
        });
      }
    });

    const hasMore = items.length >= 24;

    res.json({
      items,
      page,
      hasMore,
      category,
      filter,
      platform,
      genre,
      query,
    });
  } catch (err: any) {
    console.error('Browse error:', err);
    res.status(500).json({ error: err.message || 'Failed to browse itch.io catalog' });
  }
});

// Preset examples for instant testing
app.get('/api/examples', (_req: Request, res: Response) => {
  res.json([
    {
      title: 'Z.A.T.O. (Free Indie Game & Full OST)',
      url: 'https://nopanamaman.itch.io/z-a-t-o-i-love-the-world-and-everything-in-it',
      category: 'Game + Soundtrack',
    },
    {
      title: 'Tamaweb: Virtual Pet Game (Client + Android APK)',
      url: 'https://samandev.itch.io/tamaweb',
      category: 'Multi-platform',
    },
    {
      title: 'Booster Pack Heroes (WebGL Web Game)',
      url: 'https://funday-games.itch.io/booster-pack-heroes',
      category: 'Web Playable',
    },
    {
      title: 'Kenney Game Assets All-in-1',
      url: 'https://kenney.itch.io/kenney-game-assets',
      category: 'Asset Pack',
    },
  ]);
});

async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch(console.error);
