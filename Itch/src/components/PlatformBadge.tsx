import React from 'react';
import { Monitor, Apple, Terminal, Smartphone, Globe } from 'lucide-react';

interface PlatformBadgeProps {
  platform: string;
  size?: 'sm' | 'md';
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({ platform, size = 'md' }) => {
  const norm = platform.toLowerCase();

  let icon = <Monitor className="w-3.5 h-3.5 text-sky-400" />;
  let label = platform;

  if (norm.includes('win')) {
    label = 'Windows';
    icon = <Monitor className="w-3.5 h-3.5 text-sky-400" />;
  } else if (norm.includes('mac') || norm.includes('apple') || norm.includes('osx')) {
    label = 'macOS';
    icon = <Apple className="w-3.5 h-3.5 text-zinc-300" />;
  } else if (norm.includes('linux') || norm.includes('tux')) {
    label = 'Linux';
    icon = <Terminal className="w-3.5 h-3.5 text-amber-400" />;
  } else if (norm.includes('android') || norm.includes('apk')) {
    label = 'Android';
    icon = <Smartphone className="w-3.5 h-3.5 text-emerald-400" />;
  } else if (norm.includes('web') || norm.includes('html')) {
    label = 'Web Playable';
    icon = <Globe className="w-3.5 h-3.5 text-purple-400" />;
  }

  const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-zinc-300 ${textSize}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};
