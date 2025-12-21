import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./utils/auth";

export const getMyNotifications = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        return await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .order("desc")
            .collect();
    },
});

export const getUnreadNotifications = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        return await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .filter((q) => q.eq(q.field("isRead"), false))
            .order("desc")
            .collect();
    },
});

export const markAsRead = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.notificationId, { isRead: true });
    },
});

export const markAllAsRead = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return;

        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .filter((q) => q.eq(q.field("isRead"), false))
            .collect();

        for (const notification of unread) {
            await ctx.db.patch(notification._id, { isRead: true });
        }
    },
});

// Helper for other modules
export const createNotification = mutation({
    args: {
        userId: v.id("users"),
        title: v.string(),
        description: v.string(),
        type: v.string(),
        serviceRequestId: v.optional(v.id("service_requests")),
        esignRequestId: v.optional(v.id("esign_requests")),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("notifications", {
            ...args,
            isRead: false,
            createdAt: Date.now(),
        });
    }
});
