import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ─── Setting Keys ───
export const SETTING_KEYS = {
  SITE_NAME: "siteName",
  WHATSAPP_NUMBER: "whatsappNumber",
  WHATSAPP_MESSAGE: "whatsappMessage",
  ADMIN_PASSWORD_HASH: "adminPasswordHash",
  LOGO_URL: "logoUrl",
} as const;

// ─── Default Values ───
const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.SITE_NAME]: "Studio Web",
  [SETTING_KEYS.WHATSAPP_NUMBER]: "5491112345678",
  [SETTING_KEYS.WHATSAPP_MESSAGE]: "Hola, me interesa el diseño web: {{design_name}}. ¿Podrías darme más información?",
  [SETTING_KEYS.ADMIN_PASSWORD_HASH]: "", // Empty means use default "admin123"
  [SETTING_KEYS.LOGO_URL]: "",
};

// ─── Queries ───

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    return setting?.value ?? DEFAULTS[args.key] ?? "";
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").collect();

    const result: Record<string, string> = { ...DEFAULTS };

    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    return result;
  },
});

export const getPublicConfig = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").collect();

    const getValue = (key: string) => {
      const setting = settings.find((s) => s.key === key);
      return setting?.value ?? DEFAULTS[key] ?? "";
    };

    return {
      siteName: getValue(SETTING_KEYS.SITE_NAME),
      whatsappNumber: getValue(SETTING_KEYS.WHATSAPP_NUMBER),
      whatsappMessage: getValue(SETTING_KEYS.WHATSAPP_MESSAGE),
      logoUrl: getValue(SETTING_KEYS.LOGO_URL),
    };
  },
});

// ─── Mutations ───

export const set = mutation({
  args: {
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
      return existing._id;
    } else {
      return await ctx.db.insert("settings", {
        key: args.key,
        value: args.value,
      });
    }
  },
});

export const setMultiple = mutation({
  args: {
    settings: v.array(v.object({
      key: v.string(),
      value: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    for (const { key, value } of args.settings) {
      const existing = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, { value });
      } else {
        await ctx.db.insert("settings", { key, value });
      }
    }
    return true;
  },
});
