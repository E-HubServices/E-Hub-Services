import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./utils/auth";
import { Id } from "./_generated/dataModel";

// Send a message
export const sendMessage = mutation({
  args: {
    serviceRequestId: v.optional(v.id("service_requests")),
    esignRequestId: v.optional(v.id("esign_requests")),
    text: v.optional(v.string()),
    attachments: v.optional(v.array(v.id("_storage"))),
    messageType: v.union(
      v.literal("text"),
      v.literal("file"),
      v.literal("status_update"),
      v.literal("system")
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    if (!args.serviceRequestId && !args.esignRequestId) {
      throw new Error("RequestId (Service or Esign) is required");
    }

    const messageId = await ctx.db.insert("messages", {
      serviceRequestId: args.serviceRequestId,
      esignRequestId: args.esignRequestId,
      senderId: user._id,
      text: args.text,
      attachments: args.attachments,
      messageType: args.messageType,
      isRead: false,
    });

    return messageId;
  },
});

// Get messages for a request
export const getMessages = query({
  args: {
    serviceRequestId: v.optional(v.id("service_requests")),
    esignRequestId: v.optional(v.id("esign_requests")),
  },
  handler: async (ctx, args) => {
    let messages;
    if (args.serviceRequestId) {
      messages = await ctx.db
        .query("messages")
        .withIndex("by_service_request", (q) => q.eq("serviceRequestId", args.serviceRequestId))
        .collect();
    } else if (args.esignRequestId) {
      messages = await ctx.db
        .query("messages")
        .withIndex("by_esign_request", (q) => q.eq("esignRequestId", args.esignRequestId))
        .collect();
    } else {
      return [];
    }

    // Enrich with sender details
    const enrichedMessages = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          senderName: sender?.name || "Unknown",
          senderRole: sender?.role || "customer",
        };
      })
    );

    return enrichedMessages;
  },
});

// Mark messages as read
export const markAsRead = mutation({
  args: {
    serviceRequestId: v.optional(v.id("service_requests")),
    esignRequestId: v.optional(v.id("esign_requests")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return;

    let unreadMessages;
    if (args.serviceRequestId) {
      unreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_service_request", (q) => q.eq("serviceRequestId", args.serviceRequestId))
        .filter((q) => q.and(
          q.neq(q.field("senderId"), user._id),
          q.eq(q.field("isRead"), false)
        ))
        .collect();
    } else if (args.esignRequestId) {
      unreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_esign_request", (q) => q.eq("esignRequestId", args.esignRequestId))
        .filter((q) => q.and(
          q.neq(q.field("senderId"), user._id),
          q.eq(q.field("isRead"), false)
        ))
        .collect();
    } else {
      return;
    }

    for (const message of unreadMessages) {
      await ctx.db.patch(message._id, { isRead: true });
    }
  },
});

// Get total unread messages count for a user
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return 0;

    const unreadMessages = await ctx.db
      .query("messages")
      .filter((q) => q.and(
        q.neq(q.field("senderId"), user._id),
        q.eq(q.field("isRead"), false)
      ))
      .collect();

    return unreadMessages.length;
  },
});

// Get unread messages count for a specific request
export const getRequestUnreadCount = query({
  args: {
    serviceRequestId: v.optional(v.id("service_requests")),
    esignRequestId: v.optional(v.id("esign_requests")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return 0;

    let unreadMessages;
    if (args.serviceRequestId) {
      unreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_service_request", (q) => q.eq("serviceRequestId", args.serviceRequestId))
        .filter((q) => q.and(
          q.neq(q.field("senderId"), user._id),
          q.eq(q.field("isRead"), false)
        ))
        .collect();
    } else if (args.esignRequestId) {
      unreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_esign_request", (q) => q.eq("esignRequestId", args.esignRequestId))
        .filter((q) => q.and(
          q.neq(q.field("senderId"), user._id),
          q.eq(q.field("isRead"), false)
        ))
        .collect();
    } else {
      return 0;
    }

    return unreadMessages.length;
  },
});

// Final cleanup: Remove the legacy requestId field from all documents
export const cleanupMessages = mutation({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").collect();
    let cleanedCount = 0;

    for (const message of messages) {
      // @ts-ignore
      if (message.requestId !== undefined) {
        await ctx.db.patch(message._id, {
          // @ts-ignore
          requestId: undefined, // Unset the field
        });
        cleanedCount++;
      }
    }
    return { cleanedCount };
  },
});
