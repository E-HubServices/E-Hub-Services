import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./utils/auth";

// Store or update user on login
export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      console.error("[storeUser] No identity found - authentication not ready");
      throw new Error("Authentication not ready. Please wait a moment and try again.");
    }

    console.log("[storeUser] Processing user:", identity.email || identity.tokenIdentifier);

    // Check if we've seen this user before
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (user !== null) {
      console.log("[storeUser] Existing user found, checking for updates...");
      // If we've seen this user before, update their name and email if they've changed
      if (user.name !== identity.name || user.email !== identity.email) {
        await ctx.db.patch(user._id, {
          name: identity.name,
          email: identity.email,
        });
        console.log("[storeUser] User profile updated");
      }
      return await ctx.db.get(user._id);
    }

    // If it's a new user, create a user record
    console.log("[storeUser] Creating new user record...");
    const userId = await ctx.db.insert("users", {
      name: identity.name!,
      email: identity.email!,
      tokenIdentifier: identity.tokenIdentifier,
      role: "customer", // Default role
      isActive: true,
    });

    console.log("[storeUser] ✓ New user created successfully");
    return await ctx.db.get(userId);
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("customer"), v.literal("shop_owner"), v.literal("authorized_signatory")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    await ctx.db.patch(user._id, {
      name: args.name,
      phone: args.phone,
      role: args.role,
      isActive: true,
    });

    return { success: true };
  },
});

// Get user profile
export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

// Get all shop owners
export const getShopOwners = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "shop_owner"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get user statistics
export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      console.log("[getUserStats] No user found - returning null");
      return null; // Don't throw, just return null so frontend handles it gracefully
    }

    console.log("[getUserStats] Fetching stats for user:", user.email, "Role:", user.role);

    if (user.role === "customer") {
      // Customer statistics
      const requests = await ctx.db
        .query("service_requests")
        .withIndex("by_customer", (q) => q.eq("customerId", user._id))
        .collect();

      const payments = await ctx.db
        .query("payments")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("status"), "paid"))
        .collect();

      const totalSpent = payments.reduce((sum, payment) => sum + payment.amount, 0);

      return {
        totalRequests: requests.length,
        completedRequests: requests.filter(r => r.status === "completed").length,
        pendingRequests: requests.filter(r => r.status === "pending").length,
        inProgressRequests: requests.filter(r => r.status === "in_progress").length,
        totalSpent: totalSpent / 100, // Convert from paise to rupees
      };
    } else {
      // Shop owner statistics
      const requests = await ctx.db
        .query("service_requests")
        .withIndex("by_shop_owner", (q) => q.eq("shopOwnerId", user._id))
        .collect();

      const completedRequests = requests.filter(r => r.status === "completed");
      const totalEarnings = completedRequests.length * 50; // Placeholder commission

      return {
        totalRequests: requests.length,
        completedRequests: completedRequests.length,
        pendingRequests: requests.filter(r => r.status === "pending").length,
        assignedRequests: requests.filter(r => r.status === "assigned").length,
        inProgressRequests: requests.filter(r => r.status === "in_progress").length,
        totalEarnings,
      };
    }
  },
});

// Helper mutation to set user role by email (for testing/setup)
export const setUserRole = mutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("customer"), v.literal("shop_owner"), v.literal("authorized_signatory")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      throw new Error(`User with email ${args.email} not found`);
    }

    await ctx.db.patch(user._id, { role: args.role });

    console.log(`[setUserRole] Updated ${args.email} to role: ${args.role}`);
    return { success: true, userId: user._id, newRole: args.role };
  },
});
