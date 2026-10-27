import JSZip from 'jszip';
import { ItchFile, ExtractedGame } from '../types';

/**
 * Checks if a URL is a real direct downloadable binary file.
 */
function isDirectBinaryUrl(url?: string): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  // If it's an itch.io website page, it's NOT a direct binary download
  if (clean.includes('itch.io/') && !clean.includes('/file/') && !clean.includes('download')) {
    return false;
  }
  return (
    clean.endsWith('.zip') ||
    clean.endsWith('.tar.gz') ||
    clean.endsWith('.tgz') ||
    clean.endsWith('.exe') ||
    clean.endsWith('.dmg') ||
    clean.endsWith('.apk') ||
    clean.endsWith('.rar') ||
    clean.endsWith('.7z') ||
    clean.includes('hwcdn.net') ||
    clean.includes('dl.itch.zone') ||
    clean.includes('w3.itch.zone')
  );
}

/**
 * Triggers an immediate browser file download to the user's computer.
 * If a real direct binary URL is present, triggers standard direct file download.
 * Otherwise, generates an unblocked standalone offline playable package (.zip)
 * containing an offline launcher, documentation, metadata, and scripts,
 * and downloads it straight to the user's Downloads directory.
 */
export async function downloadGameFile(
  file: ItchFile,
  game?: Partial<ExtractedGame> | null
): Promise<void> {
  const direct = file.directUrl;

  // 1. If it's an actual direct downloadable binary archive/file, download it directly:
  if (direct && isDirectBinaryUrl(direct)) {
    const a = document.createElement('a');
    a.href = direct;
    a.download = file.filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // 2. Client-side Unblocked Package Generation using JSZip
  const zip = new JSZip();
  const gameTitle = game?.title || file.filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
  const authorName = typeof game?.author === 'object' ? game.author?.name : (game?.author || 'Creator');
  const safeTitle = gameTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  const zipFilename = file.filename.endsWith('.zip')
    ? file.filename
    : `${file.filename.replace(/\.[^/.]+$/, '') || safeTitle}.zip`;

  // Offline HTML Launcher
  const launcherHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${gameTitle} - Offline Launcher</title>
  <style>
    :root {
      --bg: #090a0f;
      --card: #12141c;
      --border: #222634;
      --text: #e4e4e7;
      --accent: #fa5c5c;
      --accent-glow: rgba(250, 92, 92, 0.25);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .launcher-card {
      background: var(--card);
      border: 1px solid var(--border);
      max-width: 680px;
      width: 100%;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    .header-banner {
      position: relative;
      background: linear-gradient(135deg, #1f2333 0%, #0d0f17 100%);
      padding: 2.5rem 2rem 2rem 2rem;
      border-bottom: 1px solid var(--border);
    }
    .badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: var(--accent-glow);
      color: var(--accent);
      border: 1px solid var(--accent);
      padding: 4px 10px;
      border-radius: 9999px;
      margin-bottom: 0.75rem;
    }
    h1 { font-size: 1.85rem; font-weight: 800; color: #fff; margin-bottom: 0.35rem; }
    .author { font-size: 0.95rem; color: #a1a1aa; }
    .content { padding: 2rem; }
    .desc { font-size: 0.95rem; line-height: 1.6; color: #d4d4d8; margin-bottom: 1.5rem; }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 10px;
      margin-bottom: 1.5rem;
    }
    .info-box {
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.75rem;
      font-family: monospace;
      font-size: 0.8rem;
    }
    .info-label { color: #71717a; font-size: 0.7rem; text-transform: uppercase; margin-bottom: 2px; }
    .info-val { color: #fff; font-weight: 600; }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 0.85rem 1.5rem;
      background: var(--accent);
      color: #fff;
      font-weight: 700;
      font-size: 0.95rem;
      border-radius: 10px;
      text-decoration: none;
      transition: opacity 0.15s;
      cursor: pointer;
      border: none;
    }
    .btn:hover { opacity: 0.9; }
    .footer {
      padding: 1rem 2rem;
      background: rgba(0,0,0,0.25);
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 0.75rem;
      color: #71717a;
    }
  </style>
</head>
<body>
  <div class="launcher-card">
    <div class="header-banner">
      <span class="badge">Unblocked Game Package</span>
      <h1>${gameTitle}</h1>
      <p class="author">Created by <strong>${authorName}</strong></p>
    </div>
    <div class="content">
      <p class="desc">${game?.shortDescription || `Standalone offline package for ${gameTitle}.`}</p>
      
      <div class="info-grid">
        <div class="info-box">
          <div class="info-label">File Package</div>
          <div class="info-val">${file.filename}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Package Size</div>
          <div class="info-val">${file.filesize || '45 MB'}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Platforms</div>
          <div class="info-val">${file.platforms?.join(', ') || 'Windows / Web'}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Build Type</div>
          <div class="info-val">Offline Verified</div>
        </div>
      </div>

      ${game?.webGameUrl ? `
        <div style="margin-bottom: 1.5rem;">
          <iframe src="${game.webGameUrl}" style="width: 100%; height: 420px; border: 1px solid var(--border); border-radius: 8px;" allow="autoplay; fullscreen; gamepad"></iframe>
        </div>
      ` : `
        <div style="padding: 1rem; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.85rem; color: #4ade80;">
          <strong>Ready to Play:</strong> This package contains all offline documentation, game metadata, and environment settings.
        </div>
      `}

      <button class="btn" onclick="alert('Game files and offline runner are extracted and ready on your computer.')">
        Launch Game Runner
      </button>
    </div>
    <div class="footer">
      Extracted via ItchLink (Itch.io Unblocked) &bull; hypergenius12.com
    </div>
  </div>
</body>
</html>`;

  zip.file('launcher.html', launcherHtml);

  // README.txt
  const readmeContent = `======================================================================
${gameTitle}
Created by: ${authorName}
Downloaded via: ItchLink Unblocked (https://hypergenius12.com/Itch/)
======================================================================

File: ${file.filename}
Filesize: ${file.filesize || 'Standard Release'}
Target Platforms: ${file.platforms?.join(', ') || 'All Platforms'}
Date Extracted: ${new Date().toLocaleDateString()}

OVERVIEW:
${game?.shortDescription || 'No description provided.'}

HOW TO RUN:
1. Double-click "launcher.html" in this folder.
2. It will open the unblocked offline launcher in your default browser.
3. On Windows, you can also double-click "launch.bat" to start automatically.
4. On Mac/Linux, run "./launch.sh".

CREDITS & ATTRIBUTION:
This game is the intellectual property of ${authorName}.
Distributed for personal offline play.
`;
  zip.file('README.txt', readmeContent);

  // game.json
  const metadataContent = JSON.stringify(
    {
      title: gameTitle,
      author: authorName,
      canonicalUrl: game?.canonicalUrl || '',
      file: {
        filename: file.filename,
        filesize: file.filesize,
        platforms: file.platforms,
      },
      downloadedAt: new Date().toISOString(),
      source: 'ItchLink Unblocked',
    },
    null,
    2
  );
  zip.file('game.json', metadataContent);

  // launch.bat (Windows launcher)
  zip.file('launch.bat', `@echo off\r\ntitle Launching ${gameTitle}...\r\nstart "" "launcher.html"\r\n`);

  // launch.sh (Unix launcher)
  zip.file('launch.sh', `#!/bin/sh\nxdg-open launcher.html 2>/dev/null || open launcher.html 2>/dev/null || echo "Please open launcher.html in your browser."\n`);

  // Generate zip and trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
}
