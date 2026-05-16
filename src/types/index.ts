// ─── Design Status ───
export type DesignStatus = "draft" | "published" | "archived";

// ─── Image Type ───
export type ImageType = "desktop" | "mobile" | "gallery";

// ─── Niche ───
export interface Niche {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  color: string;
  order: number;
  createdAt?: number;
}

// ─── Design Image ───
export interface DesignImage {
  id: string;
  _id?: string;
  url: string;
  order: number;
  isCover: boolean;
  type?: ImageType;
  storageId?: string;
}

// ─── Design ───
export interface Design {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  description: string;
  demoUrl: string;
  images: DesignImage[];
  nicheIds: string[];
  featured: boolean;
  isNew: boolean;
  popular: boolean;
  active?: boolean;
  status: DesignStatus;
  order: number;
  whatsappNumber?: string;
  whatsappNumberOverride?: string;
  whatsappMessage?: string;
  whatsappMessageOverride?: string;
  viewClicks: number;
  chooseClicks: number;
  createdAt: number;
  updatedAt?: number;
}

// ─── Site Config ───
export interface SiteConfig {
  siteName: string;
  logoUrl: string;
  whatsappNumber: string;
  whatsappMessage: string;
  adminPassword?: string; // For localStorage fallback only
}

// ─── Filter State ───
export interface FilterState {
  nicheId: string | null;
  search: string;
}

// ─── Analytics ───
export interface AnalyticsStats {
  views: number;
  chooses: number;
  modalOpens: number;
  conversionRate: number;
}

// ─── Auth ───
export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
}
