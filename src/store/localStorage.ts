// ─── LocalStorage Fallback Store ───
// This is used when Convex is not configured

import { Design, DesignImage, DesignStatus, Niche, SiteConfig } from "@/types";

const STORAGE_KEYS = {
  designs: "catalog_designs",
  niches: "catalog_niches",
  config: "catalog_config",
  seeded: "catalog_seeded",
  auth: "catalog_auth",
  favorites: "catalog_favorites",
};

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ─── Listeners ───
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((l) => l());
}

// ─── Config ───
const DEFAULT_CONFIG: SiteConfig = {
  siteName: "Studio Web",
  logoUrl: "",
  whatsappNumber: "5491112345678",
  whatsappMessage:
    "Hola, me interesa el diseño web: {{design_name}}. ¿Podrías darme más información?",
  adminPassword: "admin123",
};

export function getConfig(): SiteConfig {
  const raw = localStorage.getItem(STORAGE_KEYS.config);
  if (raw) return JSON.parse(raw);
  return DEFAULT_CONFIG;
}

export function updateConfig(config: Partial<SiteConfig>) {
  const current = getConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(updated));
  notify();
  return updated;
}

// ─── Auth ───
export function isAuthenticated(): boolean {
  return !!sessionStorage.getItem(STORAGE_KEYS.auth);
}

export function login(password: string): boolean {
  const config = getConfig();
  if (password === config.adminPassword) {
    sessionStorage.setItem(STORAGE_KEYS.auth, "true");
    return true;
  }
  return false;
}

export function logout() {
  sessionStorage.removeItem(STORAGE_KEYS.auth);
}

// ─── Niches ───
export function getNiches(): Niche[] {
  const raw = localStorage.getItem(STORAGE_KEYS.niches);
  if (raw) return JSON.parse(raw);
  return [];
}

function saveNiches(niches: Niche[]) {
  localStorage.setItem(STORAGE_KEYS.niches, JSON.stringify(niches));
  notify();
}

export function createNiche(data: Omit<Niche, "id" | "slug">): Niche {
  const niches = getNiches();
  const niche: Niche = {
    id: generateId(),
    slug: slugify(data.name),
    ...data,
  };
  niches.push(niche);
  saveNiches(niches);
  return niche;
}

export function updateNiche(
  id: string,
  data: Partial<Omit<Niche, "id">>
): Niche | null {
  const niches = getNiches();
  const index = niches.findIndex((n) => n.id === id);
  if (index === -1) return null;
  if (data.name) data.slug = slugify(data.name);
  niches[index] = { ...niches[index], ...data };
  saveNiches(niches);
  return niches[index];
}

export function deleteNiche(id: string) {
  const niches = getNiches().filter((n) => n.id !== id);
  saveNiches(niches);
  const designs = getDesigns();
  designs.forEach((d) => {
    d.nicheIds = d.nicheIds.filter((nid) => nid !== id);
  });
  saveDesigns(designs);
}

// ─── Designs ───
export function getDesigns(): Design[] {
  const raw = localStorage.getItem(STORAGE_KEYS.designs);
  if (raw) {
    const designs: Design[] = JSON.parse(raw);
    return designs.map((d) => ({
      ...d,
      status: d.status || ((d.active ? "published" : "draft") as DesignStatus),
      viewClicks: d.viewClicks || 0,
      chooseClicks: d.chooseClicks || 0,
    }));
  }
  return [];
}

export function getActiveDesigns(): Design[] {
  return getDesigns()
    .filter((d) => d.status === "published")
    .sort((a, b) => a.order - b.order);
}

export function getDesignBySlug(slug: string): Design | undefined {
  return getDesigns().find((d) => d.slug === slug);
}

export function getDesignById(id: string): Design | undefined {
  return getDesigns().find((d) => d.id === id);
}

function saveDesigns(designs: Design[]) {
  localStorage.setItem(STORAGE_KEYS.designs, JSON.stringify(designs));
  notify();
}

export function createDesign(
  data: Omit<Design, "id" | "slug" | "createdAt" | "images" | "viewClicks" | "chooseClicks"> & {
    images?: DesignImage[];
  }
): Design {
  const designs = getDesigns();
  const design: Design = {
    id: generateId(),
    slug: slugify(data.name),
    createdAt: Date.now(),
    images: data.images || [],
    viewClicks: 0,
    chooseClicks: 0,
    ...data,
  };
  designs.push(design);
  saveDesigns(designs);
  return design;
}

export function updateDesign(
  id: string,
  data: Partial<Omit<Design, "id">>
): Design | null {
  const designs = getDesigns();
  const index = designs.findIndex((d) => d.id === id);
  if (index === -1) return null;
  if (data.name) data.slug = slugify(data.name);
  designs[index] = { ...designs[index], ...data, updatedAt: Date.now() };
  saveDesigns(designs);
  return designs[index];
}

export function deleteDesign(id: string) {
  const designs = getDesigns().filter((d) => d.id !== id);
  saveDesigns(designs);
}

// ─── Click Tracking ───
export function trackViewClick(designId: string) {
  const designs = getDesigns();
  const index = designs.findIndex((d) => d.id === designId);
  if (index !== -1) {
    designs[index].viewClicks = (designs[index].viewClicks || 0) + 1;
    saveDesigns(designs);
  }
}

export function trackChooseClick(designId: string) {
  const designs = getDesigns();
  const index = designs.findIndex((d) => d.id === designId);
  if (index !== -1) {
    designs[index].chooseClicks = (designs[index].chooseClicks || 0) + 1;
    saveDesigns(designs);
  }
}

// ─── Favorites ───
export function getFavorites(): string[] {
  const raw = localStorage.getItem(STORAGE_KEYS.favorites);
  if (raw) return JSON.parse(raw);
  return [];
}

export function toggleFavorite(designId: string): boolean {
  const favs = getFavorites();
  const index = favs.indexOf(designId);
  if (index === -1) {
    favs.push(designId);
  } else {
    favs.splice(index, 1);
  }
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favs));
  notify();
  return index === -1;
}

export function isFavorite(designId: string): boolean {
  return getFavorites().includes(designId);
}

// ─── WhatsApp ───
export function getWhatsAppUrl(design: Design): string {
  const config = getConfig();
  const number = design.whatsappNumberOverride || design.whatsappNumber || config.whatsappNumber;
  const messageTemplate =
    design.whatsappMessageOverride || design.whatsappMessage || config.whatsappMessage;
  const message = messageTemplate.replace(/\{\{design_name\}\}/g, design.name);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

// ─── Seed Data ───
export function seedData() {
  if (localStorage.getItem(STORAGE_KEYS.seeded)) return;

  const niches: Niche[] = [
    { id: generateId(), name: "Barberías", slug: "barberias", color: "#a78bfa", order: 1 },
    { id: generateId(), name: "Restaurantes", slug: "restaurantes", color: "#f97316", order: 2 },
    { id: generateId(), name: "Gimnasios", slug: "gimnasios", color: "#ef4444", order: 3 },
    { id: generateId(), name: "Inmobiliarias", slug: "inmobiliarias", color: "#3b82f6", order: 4 },
    { id: generateId(), name: "Clínicas", slug: "clinicas", color: "#10b981", order: 5 },
    { id: generateId(), name: "Hoteles", slug: "hoteles", color: "#f59e0b", order: 6 },
    { id: generateId(), name: "Cafeterías", slug: "cafeterias", color: "#8b5cf6", order: 7 },
    { id: generateId(), name: "E-commerce", slug: "e-commerce", color: "#ec4899", order: 8 },
  ];

  saveNiches(niches);

  const designs: Design[] = [
    {
      id: generateId(),
      name: "Blade & Crown Barbershop",
      slug: "blade-crown-barbershop",
      description:
        "Diseño oscuro y elegante para barberías premium. Con sistema de reservas integrado y galería de estilos.",
      demoUrl: "https://example.com/demo/blade-crown",
      images: [
        { id: generateId(), url: "https://images.unsplash.com/photo-1585747860019-8926a801a6a7?w=800&q=80", order: 1, isCover: true },
        { id: generateId(), url: "https://images.unsplash.com/photo-1503951914875-452b42575ec3?w=800&q=80", order: 2, isCover: false },
        { id: generateId(), url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80", order: 3, isCover: false },
      ],
      nicheIds: [niches[0].id],
      featured: true,
      isNew: true,
      popular: false,
      status: "published",
      order: 1,
      viewClicks: 0,
      chooseClicks: 0,
      createdAt: Date.now(),
    },
    {
      id: generateId(),
      name: "Savory Kitchen",
      slug: "savory-kitchen",
      description:
        "Página web moderna para restaurantes con menú interactivo, reservas online y galería de platos.",
      demoUrl: "https://example.com/demo/savory",
      images: [
        { id: generateId(), url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80", order: 1, isCover: true },
        { id: generateId(), url: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80", order: 2, isCover: false },
        { id: generateId(), url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80", order: 3, isCover: false },
      ],
      nicheIds: [niches[1].id],
      featured: false,
      isNew: false,
      popular: true,
      status: "published",
      order: 2,
      viewClicks: 0,
      chooseClicks: 0,
      createdAt: Date.now(),
    },
    {
      id: generateId(),
      name: "Iron Fitness Pro",
      slug: "iron-fitness-pro",
      description:
        "Web de alto impacto para gimnasios y centros fitness. Planes de membresía, horarios y registro online.",
      demoUrl: "https://example.com/demo/iron-fitness",
      images: [
        { id: generateId(), url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80", order: 1, isCover: true },
        { id: generateId(), url: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80", order: 2, isCover: false },
        { id: generateId(), url: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80", order: 3, isCover: false },
      ],
      nicheIds: [niches[2].id],
      featured: true,
      isNew: false,
      popular: true,
      status: "published",
      order: 3,
      viewClicks: 0,
      chooseClicks: 0,
      createdAt: Date.now(),
    },
    {
      id: generateId(),
      name: "Prime Realty",
      slug: "prime-realty",
      description:
        "Plataforma inmobiliaria profesional con listado de propiedades, filtros avanzados y tours virtuales.",
      demoUrl: "https://example.com/demo/prime-realty",
      images: [
        { id: generateId(), url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80", order: 1, isCover: true },
        { id: generateId(), url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80", order: 2, isCover: false },
        { id: generateId(), url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80", order: 3, isCover: false },
      ],
      nicheIds: [niches[3].id],
      featured: false,
      isNew: true,
      popular: false,
      status: "published",
      order: 4,
      viewClicks: 0,
      chooseClicks: 0,
      createdAt: Date.now(),
    },
    {
      id: generateId(),
      name: "Vital Health Clinic",
      slug: "vital-health-clinic",
      description:
        "Diseño limpio y profesional para clínicas médicas. Turnos online, servicios y equipo médico.",
      demoUrl: "https://example.com/demo/vital-health",
      images: [
        { id: generateId(), url: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&q=80", order: 1, isCover: true },
        { id: generateId(), url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80", order: 2, isCover: false },
        { id: generateId(), url: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=800&q=80", order: 3, isCover: false },
      ],
      nicheIds: [niches[4].id],
      featured: false,
      isNew: false,
      popular: false,
      status: "published",
      order: 5,
      viewClicks: 0,
      chooseClicks: 0,
      createdAt: Date.now(),
    },
    {
      id: generateId(),
      name: "Grand Horizon Hotel",
      slug: "grand-horizon-hotel",
      description:
        "Sitio web de lujo para hoteles y resorts. Reservas directas, suites y experiencias exclusivas.",
      demoUrl: "https://example.com/demo/grand-horizon",
      images: [
        { id: generateId(), url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80", order: 1, isCover: true },
        { id: generateId(), url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80", order: 2, isCover: false },
        { id: generateId(), url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80", order: 3, isCover: false },
      ],
      nicheIds: [niches[5].id],
      featured: true,
      isNew: true,
      popular: true,
      status: "published",
      order: 6,
      viewClicks: 0,
      chooseClicks: 0,
      createdAt: Date.now(),
    },
    {
      id: generateId(),
      name: "Brew & Bean",
      slug: "brew-bean",
      description:
        "Diseño cálido y acogedor para cafeterías artesanales. Menú visual, ubicación y pedidos online.",
      demoUrl: "https://example.com/demo/brew-bean",
      images: [
        { id: generateId(), url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80", order: 1, isCover: true },
        { id: generateId(), url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80", order: 2, isCover: false },
        { id: generateId(), url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80", order: 3, isCover: false },
      ],
      nicheIds: [niches[6].id],
      featured: false,
      isNew: false,
      popular: true,
      status: "published",
      order: 7,
      viewClicks: 0,
      chooseClicks: 0,
      createdAt: Date.now(),
    },
    {
      id: generateId(),
      name: "Urban Style Shop",
      slug: "urban-style-shop",
      description:
        "E-commerce minimalista con catálogo visual, carrito de compras y pasarela de pagos integrada.",
      demoUrl: "https://example.com/demo/urban-style",
      images: [
        { id: generateId(), url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80", order: 1, isCover: true },
        { id: generateId(), url: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80", order: 2, isCover: false },
        { id: generateId(), url: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&q=80", order: 3, isCover: false },
      ],
      nicheIds: [niches[7].id],
      featured: false,
      isNew: true,
      popular: false,
      status: "published",
      order: 8,
      viewClicks: 0,
      chooseClicks: 0,
      createdAt: Date.now(),
    },
  ];

  saveDesigns(designs);
  localStorage.setItem(STORAGE_KEYS.seeded, "true");
}

export { generateId as genId, slugify as slug };
