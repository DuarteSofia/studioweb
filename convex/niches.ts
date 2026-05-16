import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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
    const niches = await ctx.db
      .query("niches")
      .withIndex("by_order")
      .collect();

    return niches.map((n) => ({
      ...n,
      id: n._id,
    }));
  },
});

export const getById = query({
  args: { id: v.id("niches") },
  handler: async (ctx, args) => {
    const niche = await ctx.db.get(args.id);
    if (!niche) return null;
    return { ...niche, id: niche._id };
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const niche = await ctx.db
      .query("niches")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!niche) return null;
    return { ...niche, id: niche._id };
  },
});

// ─── Mutations ───

export const create = mutation({
  args: {
    name: v.string(),
    color: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const slug = slugify(args.name);
    const now = Date.now();

    const nicheId = await ctx.db.insert("niches", {
      name: args.name,
      slug,
      color: args.color,
      order: args.order,
      createdAt: now,
    });

    return nicheId;
  },
});

export const update = mutation({
  args: {
    id: v.id("niches"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Niche not found");

    const updateData: Record<string, unknown> = { ...updates };
    if (updates.name) {
      updateData.slug = slugify(updates.name);
    }

    await ctx.db.patch(id, updateData);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("niches") },
  handler: async (ctx, args) => {
    // Remove all design-niche relationships
    const relations = await ctx.db
      .query("designNiches")
      .withIndex("by_niche", (q) => q.eq("nicheId", args.id))
      .collect();

    for (const rel of relations) {
      await ctx.db.delete(rel._id);
    }

    // Delete niche
    await ctx.db.delete(args.id);

    return args.id;
  },
});
