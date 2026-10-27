import { ItchFile, ExtractedGame } from '../types';

/**
 * Checks if a URL is a real direct downloadable binary file (CDN link).
 */
function isDirectBinaryUrl(url?: string): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  // If it's an itch.io *website page* URL, it is NOT a direct binary download
  if (clean.includes('itch.io') && !clean.includes('/file/') && !clean.includes('download')) {
    return false;
  }
  return (
    /\.(zip|tar\.gz|tgz|exe|dmg|apk|rar|7z)(\?|$)/.test(clean) ||
    clean.includes('hwcdn.net') ||
    clean.includes('dl.itch.zone') ||
    clean.includes('w3.itch.zone') ||
    clean.includes('storage.googleapis.com') ||
    clean.includes('s3.amazonaws.com')
  );
}

/**
 * Handles downloading a game file.
 *
 * - If `file.directUrl` is a real CDN binary link → triggers a direct
 *   browser download (no page navigation).
 * - Otherwise → opens the itch.io game page in a NEW TAB so the user
 *   can download from there without the current page navigating away
 *   (which would hit the school's iboss block).
 */
export async function downloadGameFile(
  file: ItchFile,
  game?: Partial<ExtractedGame> | null
): Promise<void> {
  const direct = file.directUrl;

  // 1. Real CDN binary URL → direct download via hidden <a>
  if (direct && isDirectBinaryUrl(direct)) {
    const a = document.createElement('a');
    a.href = direct;
    a.download = file.filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // 2. itch.io page URL (or any other URL) → open in a new tab.
  //    This keeps the current page intact (no iboss redirect on this tab)
  //    and lets the user download from the itch.io page in the new tab.
  const fallbackUrl =
    direct ||
    game?.canonicalUrl ||
    (file.uploadId
      ? `https://itch.io/game/download-url/${file.uploadId}`
      : null);

  if (fallbackUrl) {
    window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
  } else {
    console.warn('No download URL available for file:', file.filename);
  }
}
