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

export const getUnreadNotificationsCount = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return 0;

        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .filter((q) => q.eq(q.field("isRead"), false))
            .collect();

        return unread.length;
    },
});

export const getNewNotificationsForToast = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        return await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .filter((q) => q.eq(q.field("isToastShown"), false))
            .collect();
    },
});

export const markAsToastShown = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.notificationId, { isToastShown: true });
    },
});

export const markAsRead = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.notificationId, { isRead: true, isToastShown: true });
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
            await ctx.db.patch(notification._id, { isRead: true, isToastShown: true });
        }
    },
});

import { GenericMutationCtx } from "convex/server";
import { DataModel, Id } from "./_generated/dataModel";

// Internal helper for other modules
export async function createNotificationInternal(ctx: GenericMutationCtx<DataModel>, args: {
    userId: Id<"users">;
    title: string;
    description: string;
    type: string;
    serviceRequestId?: Id<"service_requests">;
    esignRequestId?: Id<"esign_requests">;
}) {
    return await ctx.db.insert("notifications", {
        userId: args.userId,
        title: args.title,
        description: args.description,
        type: args.type,
        serviceRequestId: args.serviceRequestId,
        esignRequestId: args.esignRequestId,
        isRead: false,
        isToastShown: false,
        createdAt: Date.now(),
    });
}

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
        return await createNotificationInternal(ctx, args);
    }
});
