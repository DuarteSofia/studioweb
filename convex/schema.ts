import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── Designs ───
  designs: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    demoUrl: v.string(),
    featured: v.boolean(),
    isNew: v.boolean(),
    popular: v.boolean(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    order: v.number(),
    viewClicks: v.number(),
    chooseClicks: v.number(),
    whatsappNumberOverride: v.optional(v.string()),
    whatsappMessageOverride: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_order", ["order"]),

  // ─── Niches ───
  niches: defineTable({
    name: v.string(),
    slug: v.string(),
    color: v.string(),
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"]),

  // ─── Design Images (separate table for better performance) ───
  designImages: defineTable({
    designId: v.id("designs"),
    storageId: v.optional(v.id("_storage")), // Optional — null for URL-based images
    url: v.optional(v.string()), // For external URLs during migration
    order: v.number(),
    isCover: v.boolean(),
    type: v.union(v.literal("desktop"), v.literal("mobile"), v.literal("gallery")),
    createdAt: v.number(),
  })
    .index("by_design", ["designId"])
    .index("by_design_order", ["designId", "order"])
    .index("by_design_cover", ["designId", "isCover"]),

  // ─── Design-Niche Relationships (many-to-many) ───
  designNiches: defineTable({
    designId: v.id("designs"),
    nicheId: v.id("niches"),
  })
    .index("by_design", ["designId"])
    .index("by_niche", ["nicheId"])
    .index("by_both", ["designId", "nicheId"]),

  // ─── Settings (global config) ───
  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),

  // ─── Analytics Events ───
  analytics: defineTable({
    designId: v.id("designs"),
    eventType: v.union(v.literal("view"), v.literal("choose"), v.literal("openModal")),
    createdAt: v.number(),
  })
    .index("by_design", ["designId"])
    .index("by_type", ["eventType"])
    .index("by_design_type", ["designId", "eventType"]),

  // ─── Admin Sessions ───
  adminSessions: defineTable({
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_expires", ["expiresAt"]),
});
