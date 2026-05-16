import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { SETTING_KEYS } from "./settings";

// Simple hash function for passwords
// Note: In production, use bcrypt or argon2 on the server side
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function generateToken(): string {
  return Math.random().toString(36).substring(2) + 
         Math.random().toString(36).substring(2) + 
         Date.now().toString(36);
}

// ─── Queries ───

export const validateSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!args.token) return false;

    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) return false;

    // Check if expired
    if (session.expiresAt < Date.now()) {
      return false;
    }

    return true;
  },
});

// ─── Mutations ───

export const login = mutation({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    // Get stored password hash
    const storedHash = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", SETTING_KEYS.ADMIN_PASSWORD_HASH))
      .first();

    const inputHash = simpleHash(args.password);

    // If no hash stored, use default password "admin123"
    const defaultHash = simpleHash("admin123");
    const expectedHash = storedHash?.value || defaultHash;

    if (inputHash !== expectedHash) {
      return { success: false, token: null, error: "Contraseña incorrecta" };
    }

    // Create session token
    const token = generateToken();
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    await ctx.db.insert("adminSessions", {
      token,
      expiresAt,
      createdAt: Date.now(),
    });

    return { success: true, token, error: null };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return true;
  },
});

export const changePassword = mutation({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // Get stored password hash
    const storedHash = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", SETTING_KEYS.ADMIN_PASSWORD_HASH))
      .first();

    const currentHash = simpleHash(args.currentPassword);
    const defaultHash = simpleHash("admin123");
    const expectedHash = storedHash?.value || defaultHash;

    if (currentHash !== expectedHash) {
      return { success: false, error: "Contraseña actual incorrecta" };
    }

    // Set new password hash
    const newHash = simpleHash(args.newPassword);

    if (storedHash) {
      await ctx.db.patch(storedHash._id, { value: newHash });
    } else {
      await ctx.db.insert("settings", {
        key: SETTING_KEYS.ADMIN_PASSWORD_HASH,
        value: newHash,
      });
    }

    return { success: true, error: null };
  },
});

export const cleanExpiredSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("adminSessions")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const session of expired) {
      await ctx.db.delete(session._id);
    }

    return expired.length;
  },
});

export const updatePassword = mutation({
  args: { newPassword: v.string() },
  handler: async (ctx, args) => {
    const storedHash = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", SETTING_KEYS.ADMIN_PASSWORD_HASH))
      .first();

    const newHash = simpleHash(args.newPassword);

    if (storedHash) {
      await ctx.db.patch(storedHash._id, { value: newHash });
    } else {
      await ctx.db.insert("settings", {
        key: SETTING_KEYS.ADMIN_PASSWORD_HASH,
        value: newHash,
      });
    }

    return { success: true };
  },
});


