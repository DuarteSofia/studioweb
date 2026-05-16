import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ─── Queries ───

export const listByDesign = query({
  args: { designId: v.id("designs") },
  handler: async (ctx, args) => {
    const images = await ctx.db
      .query("designImages")
      .withIndex("by_design", (q) => q.eq("designId", args.designId))
      .collect();

    const imagesWithUrls = await Promise.all(
      images.map(async (img) => {
        let imageUrl = img.url;
        if (img.storageId) {
          imageUrl = (await ctx.storage.getUrl(img.storageId)) ?? undefined;
        }
        return {
          id: img._id,
          designId: img.designId,
          url: imageUrl || "",
          order: img.order,
          isCover: img.isCover,
          type: img.type,
          storageId: img.storageId,
        };
      })
    );

    return imagesWithUrls.sort((a, b) => a.order - b.order);
  },
});

export const getCover = query({
  args: { designId: v.id("designs") },
  handler: async (ctx, args) => {
    const cover = await ctx.db
      .query("designImages")
      .withIndex("by_design_cover", (q) =>
        q.eq("designId", args.designId).eq("isCover", true)
      )
      .first();

    if (!cover) {
      // Fallback to first image
      const first = await ctx.db
        .query("designImages")
        .withIndex("by_design", (q) => q.eq("designId", args.designId))
        .first();

      if (!first) return null;

      let imageUrl = first.url;
      if (first.storageId) {
        imageUrl = await ctx.storage.getUrl(first.storageId) ?? undefined;
      }

      return { id: first._id, url: imageUrl || "" };
    }

    let imageUrl = cover.url;
    if (cover.storageId) {
      imageUrl = (await ctx.storage.getUrl(cover.storageId)) ?? undefined;
    }

    return { id: cover._id, url: imageUrl || "" };
  },
});

// ─── Mutations ───

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const addImage = mutation({
  args: {
    designId: v.id("designs"),
    storageId: v.id("_storage"),
    order: v.number(),
    isCover: v.boolean(),
    type: v.union(v.literal("desktop"), v.literal("mobile"), v.literal("gallery")),
  },
  handler: async (ctx, args) => {
    const imageId = await ctx.db.insert("designImages", {
      designId: args.designId,
      storageId: args.storageId,
      order: args.order,
      isCover: args.isCover,
      type: args.type,
      createdAt: Date.now(),
    });

    // If this is cover, unset other covers
    if (args.isCover) {
      const otherImages = await ctx.db
        .query("designImages")
        .withIndex("by_design", (q) => q.eq("designId", args.designId))
        .collect();

      for (const img of otherImages) {
        if (img._id !== imageId && img.isCover) {
          await ctx.db.patch(img._id, { isCover: false });
        }
      }
    }

    return imageId;
  },
});

export const addImageFromUrl = mutation({
  args: {
    designId: v.id("designs"),
    url: v.string(),
    order: v.number(),
    isCover: v.boolean(),
    type: v.union(v.literal("desktop"), v.literal("mobile"), v.literal("gallery")),
  },
  handler: async (ctx, args) => {
    // Create a placeholder storage ID for URL-based images
    // This is for migration from the old system
    const imageId = await ctx.db.insert("designImages", {
      designId: args.designId,
      // No storageId — this is a URL-based image
      url: args.url,
      order: args.order,
      isCover: args.isCover,
      type: args.type,
      createdAt: Date.now(),
    });

    // If this is cover, unset other covers
    if (args.isCover) {
      const otherImages = await ctx.db
        .query("designImages")
        .withIndex("by_design", (q) => q.eq("designId", args.designId))
        .collect();

      for (const img of otherImages) {
        if (img._id !== imageId && img.isCover) {
          await ctx.db.patch(img._id, { isCover: false });
        }
      }
    }

    return imageId;
  },
});

export const setCover = mutation({
  args: {
    imageId: v.id("designImages"),
  },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.imageId);
    if (!image) throw new Error("Image not found");

    // Unset all other covers for this design
    const otherImages = await ctx.db
      .query("designImages")
      .withIndex("by_design", (q) => q.eq("designId", image.designId))
      .collect();

    for (const img of otherImages) {
      if (img.isCover) {
        await ctx.db.patch(img._id, { isCover: false });
      }
    }

    // Set this image as cover
    await ctx.db.patch(args.imageId, { isCover: true });

    return args.imageId;
  },
});

export const updateOrder = mutation({
  args: {
    imageId: v.id("designImages"),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.imageId, { order: args.order });
    return args.imageId;
  },
});

export const reorderImages = mutation({
  args: {
    images: v.array(v.object({
      id: v.id("designImages"),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    for (const img of args.images) {
      await ctx.db.patch(img.id, { order: img.order });
    }
    return true;
  },
});

export const remove = mutation({
  args: { imageId: v.id("designImages") },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.imageId);
    if (!image) throw new Error("Image not found");

    // Delete from storage if exists
    if (image.storageId) {
      try {
        await ctx.storage.delete(image.storageId);
      } catch (e) {
        // Storage might not exist (for URL-based images)
      }
    }

    // If this was cover, set first remaining image as cover
    if (image.isCover) {
      const remaining = await ctx.db
        .query("designImages")
        .withIndex("by_design", (q) => q.eq("designId", image.designId))
        .collect();

      const first = remaining.find((img) => img._id !== args.imageId);
      if (first) {
        await ctx.db.patch(first._id, { isCover: true });
      }
    }

    await ctx.db.delete(args.imageId);

    return args.imageId;
  },
});
