import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ─── Helper: Generate slug ───
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ─── Queries ───

export const list = query({
  args: {},
  handler: async (ctx) => {
    const designs = await ctx.db
      .query("designs")
      .withIndex("by_order")
      .collect();

    // Get images and niches for each design
    const designsWithRelations = await Promise.all(
      designs.map(async (design) => {
        const images = await ctx.db
          .query("designImages")
          .withIndex("by_design", (q) => q.eq("designId", design._id))
          .collect();

        const designNiches = await ctx.db
          .query("designNiches")
          .withIndex("by_design", (q) => q.eq("designId", design._id))
          .collect();

        const nicheIds = designNiches.map((dn) => dn.nicheId);

        // Get image URLs from storage
        const imagesWithUrls = await Promise.all(
          images.map(async (img) => {
            let imageUrl = img.url;
            if (img.storageId) {
              imageUrl = (await ctx.storage.getUrl(img.storageId)) ?? undefined;
            }
            return {
              id: img._id,
              url: imageUrl || "",
              order: img.order,
              isCover: img.isCover,
              type: img.type,
            };
          })
        );

        return {
          ...design,
          id: design._id,
          images: imagesWithUrls.sort((a, b) => a.order - b.order),
          nicheIds,
        };
      })
    );

    return designsWithRelations;
  },
});

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const designs = await ctx.db
      .query("designs")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    // Sort by order
    const sorted = designs.sort((a, b) => a.order - b.order);

    // Get images and niches for each design
    const designsWithRelations = await Promise.all(
      sorted.map(async (design) => {
        const images = await ctx.db
          .query("designImages")
          .withIndex("by_design", (q) => q.eq("designId", design._id))
          .collect();

        const designNiches = await ctx.db
          .query("designNiches")
          .withIndex("by_design", (q) => q.eq("designId", design._id))
          .collect();

        const nicheIds = designNiches.map((dn) => dn.nicheId);

        // Get image URLs from storage
        const imagesWithUrls = await Promise.all(
          images.map(async (img) => {
            let imageUrl = img.url;
            if (img.storageId) {
              imageUrl = (await ctx.storage.getUrl(img.storageId)) ?? undefined;
            }
            return {
              id: img._id,
              url: imageUrl || "",
              order: img.order,
              isCover: img.isCover,
              type: img.type,
            };
          })
        );

        return {
          ...design,
          id: design._id,
          images: imagesWithUrls.sort((a, b) => a.order - b.order),
          nicheIds,
        };
      })
    );

    return designsWithRelations;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const design = await ctx.db
      .query("designs")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!design) return null;

    const images = await ctx.db
      .query("designImages")
      .withIndex("by_design", (q) => q.eq("designId", design._id))
      .collect();

    const designNiches = await ctx.db
      .query("designNiches")
      .withIndex("by_design", (q) => q.eq("designId", design._id))
      .collect();

    const nicheIds = designNiches.map((dn) => dn.nicheId);

    const imagesWithUrls = await Promise.all(
      images.map(async (img) => {
        let imageUrl = img.url;
        if (img.storageId) {
          imageUrl = (await ctx.storage.getUrl(img.storageId)) ?? undefined;
        }
        return {
          id: img._id,
          url: imageUrl || "",
          order: img.order,
          isCover: img.isCover,
          type: img.type,
        };
      })
    );

    return {
      ...design,
      id: design._id,
      images: imagesWithUrls.sort((a, b) => a.order - b.order),
      nicheIds,
    };
  },
});

export const getById = query({
  args: { id: v.id("designs") },
  handler: async (ctx, args) => {
    const design = await ctx.db.get(args.id);
    if (!design) return null;

    const images = await ctx.db
      .query("designImages")
      .withIndex("by_design", (q) => q.eq("designId", design._id))
      .collect();

    const designNiches = await ctx.db
      .query("designNiches")
      .withIndex("by_design", (q) => q.eq("designId", design._id))
      .collect();

    const nicheIds = designNiches.map((dn) => dn.nicheId);

    const imagesWithUrls = await Promise.all(
      images.map(async (img) => {
        let imageUrl = img.url;
        if (img.storageId) {
          imageUrl = (await ctx.storage.getUrl(img.storageId)) ?? undefined;
        }
        return {
          id: img._id,
          url: imageUrl || "",
          order: img.order,
          isCover: img.isCover,
          type: img.type,
        };
      })
    );

    return {
      ...design,
      id: design._id,
      images: imagesWithUrls.sort((a, b) => a.order - b.order),
      nicheIds,
    };
  },
});

// ─── Mutations ───

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    demoUrl: v.string(),
    featured: v.boolean(),
    isNew: v.boolean(),
    popular: v.boolean(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    order: v.number(),
    nicheIds: v.array(v.id("niches")),
    whatsappNumberOverride: v.optional(v.string()),
    whatsappMessageOverride: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const slug = slugify(args.name);

    const designId = await ctx.db.insert("designs", {
      name: args.name,
      slug,
      description: args.description,
      demoUrl: args.demoUrl,
      featured: args.featured,
      isNew: args.isNew,
      popular: args.popular,
      status: args.status,
      order: args.order,
      viewClicks: 0,
      chooseClicks: 0,
      whatsappNumberOverride: args.whatsappNumberOverride,
      whatsappMessageOverride: args.whatsappMessageOverride,
      createdAt: now,
      updatedAt: now,
    });

    // Create niche relationships
    for (const nicheId of args.nicheIds) {
      await ctx.db.insert("designNiches", {
        designId,
        nicheId,
      });
    }

    return designId;
  },
});

export const update = mutation({
  args: {
    id: v.id("designs"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    demoUrl: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    isNew: v.optional(v.boolean()),
    popular: v.optional(v.boolean()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
    order: v.optional(v.number()),
    nicheIds: v.optional(v.array(v.id("niches"))),
    whatsappNumberOverride: v.optional(v.string()),
    whatsappMessageOverride: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, nicheIds, ...updates } = args;

    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Design not found");

    // Update slug if name changed
    const updateData: Record<string, unknown> = { ...updates, updatedAt: Date.now() };
    if (updates.name) {
      updateData.slug = slugify(updates.name);
    }

    await ctx.db.patch(id, updateData);

    // Update niche relationships if provided
    if (nicheIds !== undefined) {
      // Delete existing relationships
      const existingRelations = await ctx.db
        .query("designNiches")
        .withIndex("by_design", (q) => q.eq("designId", id))
        .collect();

      for (const rel of existingRelations) {
        await ctx.db.delete(rel._id);
      }

      // Create new relationships
      for (const nicheId of nicheIds) {
        await ctx.db.insert("designNiches", {
          designId: id,
          nicheId,
        });
      }
    }

    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("designs") },
  handler: async (ctx, args) => {
    // Delete images
    const images = await ctx.db
      .query("designImages")
      .withIndex("by_design", (q) => q.eq("designId", args.id))
      .collect();

    for (const img of images) {
      if (img.storageId) {
        await ctx.storage.delete(img.storageId);
      }
      await ctx.db.delete(img._id);
    }

    // Delete niche relationships
    const relations = await ctx.db
      .query("designNiches")
      .withIndex("by_design", (q) => q.eq("designId", args.id))
      .collect();

    for (const rel of relations) {
      await ctx.db.delete(rel._id);
    }

    // Delete analytics
    const analytics = await ctx.db
      .query("analytics")
      .withIndex("by_design", (q) => q.eq("designId", args.id))
      .collect();

    for (const event of analytics) {
      await ctx.db.delete(event._id);
    }

    // Delete design
    await ctx.db.delete(args.id);

    return args.id;
  },
});

export const updateOrder = mutation({
  args: {
    id: v.id("designs"),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { order: args.order, updatedAt: Date.now() });
    return args.id;
  },
});

export const toggleFeatured = mutation({
  args: { id: v.id("designs") },
  handler: async (ctx, args) => {
    const design = await ctx.db.get(args.id);
    if (!design) throw new Error("Design not found");
    await ctx.db.patch(args.id, { featured: !design.featured, updatedAt: Date.now() });
    return args.id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("designs"),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status, updatedAt: Date.now() });
    return args.id;
  },
});
