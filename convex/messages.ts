import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./utils/auth";

// Send a message
export const sendMessage = mutation({
  args: {
    requestId: v.id("service_requests"),
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

    const messageId = await ctx.db.insert("messages", {
      requestId: args.requestId,
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
  args: { requestId: v.id("service_requests") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .collect();

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
  args: { requestId: v.id("service_requests") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return;

    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .filter((q) => q.and(
        q.neq(q.field("senderId"), user._id),
        q.eq(q.field("isRead"), false)
      ))
      .collect();

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
  args: { requestId: v.id("service_requests") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return 0;

    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .filter((q) => q.and(
        q.neq(q.field("senderId"), user._id),
        q.eq(q.field("isRead"), false)
      ))
      .collect();

    return unreadMessages.length;
  },
});
