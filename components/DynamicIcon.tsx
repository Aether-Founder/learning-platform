'use client';

import {
  Youtube,
  FileText,
  BookOpen,
  Video,
  Link as LinkIcon,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  youtube: Youtube,
  substack: FileText,
  book: BookOpen,
  video: Video,
  link: LinkIcon,
  external: ExternalLink,
};

interface DynamicIconProps {
  icon: string;
  iconType?: 'name' | 'url';
  className?: string;
}

export function DynamicIcon({ icon, iconType = 'name', className = 'w-4 h-4' }: DynamicIconProps) {
  if (iconType === 'url') {
    return <img src={icon} alt="" className={className} style={{ objectFit: 'contain' }} />;
  }

  const IconComponent = iconMap[icon.toLowerCase()];

  if (!IconComponent) {
    // Fallback to a default link icon
    return <LinkIcon className={className} />;
  }

  return <IconComponent className={className} />;
}
