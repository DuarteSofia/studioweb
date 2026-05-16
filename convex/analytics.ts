import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ─── Event Types ───
export type EventType = "view" | "choose" | "openModal";

// ─── Queries ───

export const getDesignStats = query({
  args: { designId: v.id("designs") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("analytics")
      .withIndex("by_design", (q) => q.eq("designId", args.designId))
      .collect();

    const views = events.filter((e) => e.eventType === "view").length;
    const chooses = events.filter((e) => e.eventType === "choose").length;
    const modalOpens = events.filter((e) => e.eventType === "openModal").length;

    return {
      views,
      chooses,
      modalOpens,
      conversionRate: views > 0 ? (chooses / views) * 100 : 0,
    };
  },
});

export const getAllStats = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("analytics").collect();

    const views = events.filter((e) => e.eventType === "view").length;
    const chooses = events.filter((e) => e.eventType === "choose").length;
    const modalOpens = events.filter((e) => e.eventType === "openModal").length;

    // Stats by design
    const byDesign = new Map<string, { views: number; chooses: number; modalOpens: number }>();

    for (const event of events) {
      const designId = event.designId.toString();
      const current = byDesign.get(designId) || { views: 0, chooses: 0, modalOpens: 0 };

      if (event.eventType === "view") current.views++;
      else if (event.eventType === "choose") current.chooses++;
      else if (event.eventType === "openModal") current.modalOpens++;

      byDesign.set(designId, current);
    }

    return {
      totals: {
        views,
        chooses,
        modalOpens,
        conversionRate: views > 0 ? (chooses / views) * 100 : 0,
      },
      byDesign: Object.fromEntries(byDesign),
    };
  },
});

export const getRecentEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const events = await ctx.db
      .query("analytics")
      .order("desc")
      .take(limit);

    return events.map((e) => ({
      id: e._id,
      designId: e.designId,
      eventType: e.eventType,
      createdAt: e.createdAt,
    }));
  },
});

// ─── Mutations ───

export const track = mutation({
  args: {
    designId: v.id("designs"),
    eventType: v.union(v.literal("view"), v.literal("choose"), v.literal("openModal")),
  },
  handler: async (ctx, args) => {
    // Also update the denormalized counts on the design
    const design = await ctx.db.get(args.designId);
    if (design) {
      if (args.eventType === "view") {
        await ctx.db.patch(args.designId, {
          viewClicks: (design.viewClicks || 0) + 1,
        });
      } else if (args.eventType === "choose") {
        await ctx.db.patch(args.designId, {
          chooseClicks: (design.chooseClicks || 0) + 1,
        });
      }
    }

    // Insert event
    return await ctx.db.insert("analytics", {
      designId: args.designId,
      eventType: args.eventType,
      createdAt: Date.now(),
    });
  },
});

export const trackView = mutation({
  args: { designId: v.id("designs") },
  handler: async (ctx, args) => {
    const design = await ctx.db.get(args.designId);
    if (design) {
      await ctx.db.patch(args.designId, {
        viewClicks: (design.viewClicks || 0) + 1,
      });
    }

    return await ctx.db.insert("analytics", {
      designId: args.designId,
      eventType: "view",
      createdAt: Date.now(),
    });
  },
});

export const trackChoose = mutation({
  args: { designId: v.id("designs") },
  handler: async (ctx, args) => {
    const design = await ctx.db.get(args.designId);
    if (design) {
      await ctx.db.patch(args.designId, {
        chooseClicks: (design.chooseClicks || 0) + 1,
      });
    }

    return await ctx.db.insert("analytics", {
      designId: args.designId,
      eventType: "choose",
      createdAt: Date.now(),
    });
  },
});

export const trackModalOpen = mutation({
  args: { designId: v.id("designs") },
  handler: async (ctx, args) => {
    return await ctx.db.insert("analytics", {
      designId: args.designId,
      eventType: "openModal",
      createdAt: Date.now(),
    });
  },
});
