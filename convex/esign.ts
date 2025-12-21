import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./utils/auth";

// Create a new e-Sign / e-Seal request
export const createEsignRequest = mutation({
    args: {
        details: v.object({
            name: v.string(),
            mobile: v.string(),
            address: v.string(),
            shopNumber: v.optional(v.string()),
        }),
        documentFileId: v.id("_storage"),
        purpose: v.string(),
        requireSignature: v.boolean(),
        requireSeal: v.boolean(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Authentication required");

        const requestId = await ctx.db.insert("esign_requests", {
            requesterId: user._id,
            requesterType: user.role === "shop_owner" ? "shop_owner" : "customer",
            requesterDetails: args.details,
            documentFileId: args.documentFileId,
            purpose: args.purpose,
            requireSignature: args.requireSignature,
            requireSeal: args.requireSeal,
            status: "pending",
            createdAt: Date.now(),
        });

        // Audit Log
        await ctx.db.insert("esign_audit_logs", {
            requestId,
            action: "CREATED",
            performedBy: user._id,
            performedAt: Date.now(),
        });

        return requestId;
    },
});

// Get e-Sign requests based on role
export const getEsignRequests = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        const isAuthority = user.role === "authorized_signatory" || user.role === "shop_owner";

        if (isAuthority) {
            // Authority sees everything
            return await ctx.db
                .query("esign_requests")
                .order("desc")
                .collect();
        } else {
            // Customers/Shops see their own
            return await ctx.db
                .query("esign_requests")
                .withIndex("by_requester", (q) => q.eq("requesterId", user._id))
                .order("desc")
                .collect();
        }
    },
});

// Get single request
export const getEsignRequestById = query({
    args: { requestId: v.id("esign_requests") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const request = await ctx.db.get(args.requestId);
        if (!request) return null;

        // Check permissions: Signatories and the original requester can view
        const isAuthority = user.role === "authorized_signatory" || user.role === "shop_owner";
        if (!isAuthority && request.requesterId !== user._id) {
            throw new Error("Access denied");
        }

        return request;
    },
});

// Update status (Approve/Reject)
export const updateEsignStatus = mutation({
    args: {
        requestId: v.id("esign_requests"),
        status: v.union(v.literal("accepted"), v.literal("rejected"), v.literal("cancelled")),
        rejectionReason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const request = await ctx.db.get(args.requestId);
        if (!request) throw new Error("Request not found");

        const isAuthority = user.role === "authorized_signatory" || user.role === "shop_owner";

        // Owners can approve/reject, Users can only cancel
        if (args.status === "cancelled") {
            if (request.requesterId !== user._id) throw new Error("Unauthorized to cancel");
        } else {
            if (!isAuthority) throw new Error("Unauthorized signatory");
        }

        await ctx.db.patch(args.requestId, {
            status: args.status,
            rejectionReason: args.rejectionReason,
        });

        // Audit Log
        await ctx.db.insert("esign_audit_logs", {
            requestId: args.requestId,
            action: args.status.toUpperCase(),
            performedBy: user._id,
            performedAt: Date.now(),
        });

        return true;
    },
});

// Get Audit Logs
export const getAuditLogs = query({
    args: { requestId: v.id("esign_requests") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const request = await ctx.db.get(args.requestId);
        if (!request) throw new Error("Request not found");

        const isAuthority = user.role === "authorized_signatory" || user.role === "shop_owner";
        const isOwner = request.requesterId === user._id;

        if (!isAuthority && !isOwner) {
            throw new Error("Unauthorized: Access denied to audit logs");
        }

        return await ctx.db
            .query("esign_audit_logs")
            .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
            .collect();
    }
});

// Internal mutation used by Actions
export const internalCompleteSign = mutation({
    args: {
        requestId: v.id("esign_requests"),
        signedFileId: v.id("_storage"),
        fileSize: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // This is internal, usually called by action
        const request = await ctx.db.get(args.requestId);
        if (!request) throw new Error("Request not found");

        const requester = await ctx.db.get(request.requesterId);

        // Search for an authority to record the signature name
        const owner = await ctx.db
            .query("users")
            .filter(q => q.or(
                q.eq(q.field("role"), "authorized_signatory"),
                q.eq(q.field("role"), "shop_owner")
            ))
            .first();

        await ctx.db.patch(args.requestId, {
            status: "signed",
            signedFileId: args.signedFileId,
            authorityDetails: {
                authorityId: "NALAVARIYAM-001",
                signedBy: owner?.name || "Official Signatory",
                signedAt: Date.now(),
            },
        });

        // Save meaningful metadata for the signed file
        const safeName = `${(requester?.name || "user").trim().replace(/\s+/g, '_').toLowerCase()}-signed-document.pdf`;
        await ctx.db.insert("file_metadata", {
            storageId: args.signedFileId,
            originalName: safeName,
            fileType: "application/pdf",
            fileSize: args.fileSize || 0,
            uploadedBy: owner?._id || request.requesterId,
            isProcessed: true,
        });

        // Audit Log
        await ctx.db.insert("esign_audit_logs", {
            requestId: args.requestId,
            action: "SIGNED",
            performedBy: owner?._id || request.requesterId, // Fallback if owner not found in search
            performedAt: Date.now(),
        });

        return true;
    },
});

// Internal query for Actions (Internal only)
export const getRequestInternal = query({
    args: { requestId: v.id("esign_requests") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.requestId);
    }
});
