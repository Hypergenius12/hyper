import React, { useState } from 'react';
import { X, Copy, Check, Download, Terminal, Code, FileText } from 'lucide-react';
import { ExtractedGame, ItchFile } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: ExtractedGame;
  selectedFiles?: ItchFile[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  game,
  selectedFiles,
}) => {
  const [tab, setTab] = useState<'bash' | 'powershell' | 'txt' | 'json'>('bash');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const files = selectedFiles && selectedFiles.length > 0 ? selectedFiles : game.files;
  const baseUrl = window.location.origin;

  // Generate scripts
  const generateBash = () => {
    let script = `#!/usr/bin/env bash\n# Downloads for "${game.title}" extracted via ItchLink\nmkdir -p "${game.slug}" && cd "${game.slug}"\n\n`;
    files.forEach((file) => {
      const url = file.uploadId
        ? `${baseUrl}/api/download?gameUrl=${encodeURIComponent(game.canonicalUrl)}&uploadId=${file.uploadId}`
        : file.directUrl || '';
      script += `# File: ${file.filename} (${file.filesize})\n`;
      script += `curl -L -o "${file.filename}" "${url}"\n\n`;
    });
    return script;
  };

  const generatePowerShell = () => {
    let script = `# Downloads for "${game.title}" extracted via ItchLink\nNew-Item -ItemType Directory -Force -Path "${game.slug}" | Out-Null\nSet-Location "${game.slug}"\n\n`;
    files.forEach((file) => {
      const url = file.uploadId
        ? `${baseUrl}/api/download?gameUrl=${encodeURIComponent(game.canonicalUrl)}&uploadId=${file.uploadId}`
        : file.directUrl || '';
      script += `# File: ${file.filename} (${file.filesize})\n`;
      script += `Invoke-WebRequest -Uri "${url}" -OutFile "${file.filename}"\n\n`;
    });
    return script;
  };

  const generateTxt = () => {
    return files
      .map((file) => {
        const url = file.uploadId
          ? `${baseUrl}/api/download?gameUrl=${encodeURIComponent(game.canonicalUrl)}&uploadId=${file.uploadId}`
          : file.directUrl || '';
        return `${file.filename}\t${file.filesize}\t${url}`;
      })
      .join('\n');
  };

  const generateJson = () => {
    return JSON.stringify(
      {
        game: game.title,
        url: game.canonicalUrl,
        exportedAt: new Date().toISOString(),
        files: files.map((f) => ({
          filename: f.filename,
          filesize: f.filesize,
          platforms: f.platforms,
          downloadUrl: f.uploadId
            ? `${baseUrl}/api/download?gameUrl=${encodeURIComponent(game.canonicalUrl)}&uploadId=${f.uploadId}`
            : f.directUrl,
        })),
      },
      null,
      2
    );
  };

  let content = '';
  let filename = `${game.slug}-downloads.sh`;
  let mimeType = 'text/x-sh';

  switch (tab) {
    case 'bash':
      content = generateBash();
      filename = `${game.slug}-downloads.sh`;
      mimeType = 'text/x-sh';
      break;
    case 'powershell':
      content = generatePowerShell();
      filename = `${game.slug}-downloads.ps1`;
      mimeType = 'text/plain';
      break;
    case 'txt':
      content = generateTxt();
      filename = `${game.slug}-links.txt`;
      mimeType = 'text/plain';
      break;
    case 'json':
      content = generateJson();
      filename = `${game.slug}-links.json`;
      mimeType = 'application/json';
      break;
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-2xl neu-card rounded-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#151720] border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg neu-inset text-emerald-400">
              <Terminal className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Export Download Script &amp; URLs
              </h2>
              <p className="text-xs text-zinc-400">
                Automate downloads via curl, wget, PowerShell, or JSON
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg neu-button text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center gap-1.5 px-5 pt-3.5 bg-[#12141a] border-b border-zinc-800/80 text-xs font-mono">
          <button
            type="button"
            onClick={() => setTab('bash')}
            className={`px-3 py-1.5 rounded-t-lg transition cursor-pointer flex items-center gap-1.5 ${
              tab === 'bash'
                ? 'neu-button-active font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Bash (.sh)</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('powershell')}
            className={`px-3 py-1.5 rounded-t-lg transition cursor-pointer flex items-center gap-1.5 ${
              tab === 'powershell'
                ? 'neu-button-active font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>PowerShell (.ps1)</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('txt')}
            className={`px-3 py-1.5 rounded-t-lg transition cursor-pointer flex items-center gap-1.5 ${
              tab === 'txt'
                ? 'neu-button-active font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Plain URLs (.txt)</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('json')}
            className={`px-3 py-1.5 rounded-t-lg transition cursor-pointer flex items-center gap-1.5 ${
              tab === 'json'
                ? 'neu-button-active font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>JSON (.json)</span>
          </button>
        </div>

        {/* Content Preview */}
        <div className="flex-1 p-5 overflow-y-auto bg-[#0d0e13] font-mono text-xs">
          <pre className="p-4 rounded-xl neu-inset text-zinc-300 overflow-x-auto whitespace-pre selection:bg-[#fa5c5c]/40 leading-relaxed text-[11px]">
            {content}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#151720] border-t border-zinc-800">
          <span className="text-xs text-zinc-400 font-mono">
            {files.length} file{files.length === 1 ? '' : 's'} included
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg neu-button text-zinc-200 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copy Content</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadFile}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg neu-btn-accent text-white transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Save File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
