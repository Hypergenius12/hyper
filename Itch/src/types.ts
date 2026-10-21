export interface ItchFile {
  id: string;
  uploadId?: string;
  filename: string;
  filesize: string;
  platforms: string[];
  date?: string;
  directUrl?: string;
  external?: boolean;
}

export interface ExternalMirror {
  title: string;
  url: string;
  type: string;
}

export interface ItchComment {
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

export interface ExtractedGame {
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

export interface ExamplePreset {
  title: string;
  url: string;
  category: string;
}

export interface BatchItem {
  url: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  data?: ExtractedGame;
  error?: string;
}

export interface BrowseItem {
  id: string;
  title: string;
  url: string;
  author: string;
  authorUrl?: string;
  description: string;
  genre?: string;
  price?: string;
  platforms: string[];
  thumbnail?: string;
  coverColor?: string;
}

export interface BrowseResponse {
  items: BrowseItem[];
  page: number;
  hasMore: boolean;
  category: string;
  filter: string;
  platform?: string;
  genre?: string;
  query?: string;
}

