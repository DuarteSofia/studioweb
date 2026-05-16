import { mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Initial Seed Data ───
// This runs once to populate the database with initial data

const INITIAL_NICHES = [
  { name: "Barberías", color: "#a78bfa", order: 1 },
  { name: "Restaurantes", color: "#f97316", order: 2 },
  { name: "Gimnasios", color: "#ef4444", order: 3 },
  { name: "Inmobiliarias", color: "#3b82f6", order: 4 },
  { name: "Clínicas", color: "#10b981", order: 5 },
  { name: "Hoteles", color: "#f59e0b", order: 6 },
  { name: "Cafeterías", color: "#8b5cf6", order: 7 },
  { name: "E-commerce", color: "#ec4899", order: 8 },
];

const INITIAL_DESIGNS = [
  {
    name: "Blade & Crown Barbershop",
    description: "Diseño oscuro y elegante para barberías premium. Con sistema de reservas integrado y galería de estilos.",
    demoUrl: "https://example.com/demo/blade-crown",
    featured: true,
    isNew: true,
    popular: false,
    nicheIndex: 0,
    images: [
      { url: "https://images.unsplash.com/photo-1585747860019-8926a801a6a7?w=800&q=80", isCover: true },
      { url: "https://images.unsplash.com/photo-1503951914875-452b42575ec3?w=800&q=80", isCover: false },
      { url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80", isCover: false },
    ],
  },
  {
    name: "Savory Kitchen",
    description: "Página web moderna para restaurantes con menú interactivo, reservas online y galería de platos.",
    demoUrl: "https://example.com/demo/savory",
    featured: false,
    isNew: false,
    popular: true,
    nicheIndex: 1,
    images: [
      { url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80", isCover: true },
      { url: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80", isCover: false },
      { url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80", isCover: false },
    ],
  },
  {
    name: "Iron Fitness Pro",
    description: "Web de alto impacto para gimnasios y centros fitness. Planes de membresía, horarios y registro online.",
    demoUrl: "https://example.com/demo/iron-fitness",
    featured: true,
    isNew: false,
    popular: true,
    nicheIndex: 2,
    images: [
      { url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80", isCover: true },
      { url: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80", isCover: false },
      { url: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80", isCover: false },
    ],
  },
  {
    name: "Prime Realty",
    description: "Plataforma inmobiliaria profesional con listado de propiedades, filtros avanzados y tours virtuales.",
    demoUrl: "https://example.com/demo/prime-realty",
    featured: false,
    isNew: true,
    popular: false,
    nicheIndex: 3,
    images: [
      { url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80", isCover: true },
      { url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80", isCover: false },
      { url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80", isCover: false },
    ],
  },
  {
    name: "Vital Health Clinic",
    description: "Diseño limpio y profesional para clínicas médicas. Turnos online, servicios y equipo médico.",
    demoUrl: "https://example.com/demo/vital-health",
    featured: false,
    isNew: false,
    popular: false,
    nicheIndex: 4,
    images: [
      { url: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&q=80", isCover: true },
      { url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80", isCover: false },
      { url: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=800&q=80", isCover: false },
    ],
  },
  {
    name: "Grand Horizon Hotel",
    description: "Sitio web de lujo para hoteles y resorts. Reservas directas, suites y experiencias exclusivas.",
    demoUrl: "https://example.com/demo/grand-horizon",
    featured: true,
    isNew: true,
    popular: true,
    nicheIndex: 5,
    images: [
      { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80", isCover: true },
      { url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80", isCover: false },
      { url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80", isCover: false },
    ],
  },
  {
    name: "Brew & Bean",
    description: "Diseño cálido y acogedor para cafeterías artesanales. Menú visual, ubicación y pedidos online.",
    demoUrl: "https://example.com/demo/brew-bean",
    featured: false,
    isNew: false,
    popular: true,
    nicheIndex: 6,
    images: [
      { url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80", isCover: true },
      { url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80", isCover: false },
      { url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80", isCover: false },
    ],
  },
  {
    name: "Urban Style Shop",
    description: "E-commerce minimalista con catálogo visual, carrito de compras y pasarela de pagos integrada.",
    demoUrl: "https://example.com/demo/urban-style",
    featured: false,
    isNew: true,
    popular: false,
    nicheIndex: 7,
    images: [
      { url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80", isCover: true },
      { url: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80", isCover: false },
      { url: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&q=80", isCover: false },
    ],
  },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const seedDatabase = mutation({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    // Check if already seeded
    const existingNiches = await ctx.db.query("niches").first();
    if (existingNiches && !args.force) {
      return { success: false, message: "Database already seeded" };
    }

    // If forcing, clear existing data
    if (args.force) {
      // Clear all tables
      const designs = await ctx.db.query("designs").collect();
      const niches = await ctx.db.query("niches").collect();
      const images = await ctx.db.query("designImages").collect();
      const relations = await ctx.db.query("designNiches").collect();
      const analytics = await ctx.db.query("analytics").collect();

      for (const d of designs) await ctx.db.delete(d._id);
      for (const n of niches) await ctx.db.delete(n._id);
      for (const i of images) await ctx.db.delete(i._id);
      for (const r of relations) await ctx.db.delete(r._id);
      for (const a of analytics) await ctx.db.delete(a._id);
    }

    const now = Date.now();

    // Create niches
    const nicheIds: string[] = [];
    for (const niche of INITIAL_NICHES) {
      const id = await ctx.db.insert("niches", {
        name: niche.name,
        slug: slugify(niche.name),
        color: niche.color,
        order: niche.order,
        createdAt: now,
      });
      nicheIds.push(id);
    }

    // Create designs
    for (let i = 0; i < INITIAL_DESIGNS.length; i++) {
      const design = INITIAL_DESIGNS[i];
      const designId = await ctx.db.insert("designs", {
        name: design.name,
        slug: slugify(design.name),
        description: design.description,
        demoUrl: design.demoUrl,
        featured: design.featured,
        isNew: design.isNew,
        popular: design.popular,
        status: "published",
        order: i + 1,
        viewClicks: 0,
        chooseClicks: 0,
        createdAt: now,
        updatedAt: now,
      });

      // Create design-niche relationship
      await ctx.db.insert("designNiches", {
        designId,
        nicheId: nicheIds[design.nicheIndex] as any,
      });

      // Create images
      for (let j = 0; j < design.images.length; j++) {
        const img = design.images[j];
        await ctx.db.insert("designImages", {
          designId,
          // No storageId — URL-based image
          url: img.url,
          order: j + 1,
          isCover: img.isCover,
          type: "desktop",
          createdAt: now,
        });
      }
    }

    return {
      success: true,
      message: `Seeded ${INITIAL_NICHES.length} niches and ${INITIAL_DESIGNS.length} designs`,
    };
  },
});
