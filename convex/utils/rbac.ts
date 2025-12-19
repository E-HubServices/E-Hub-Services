import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { getRequiredUser } from "./auth";

/**
 * RBAC (Role-Based Access Control) Utilities
 * Provides secure role verification and access control
 */

export type UserRole = "customer" | "shop_owner";

/**
 * Verify user has a specific role
 */
export async function requireRole(
    ctx: QueryCtx | MutationCtx,
    requiredRole: UserRole
) {
    const user = await getRequiredUser(ctx);

    if (user.role !== requiredRole) {
        throw new Error(`Access denied: ${requiredRole} role required`);
    }

    return user;
}

/**
 * Verify user is a customer
 */
export async function requireCustomer(ctx: QueryCtx | MutationCtx) {
    return await requireRole(ctx, "customer");
}

/**
 * Verify user is a shop owner
 */
export async function requireShopOwner(ctx: QueryCtx | MutationCtx) {
    return await requireRole(ctx, "shop_owner");
}

/**
 * Verify user owns a specific resource
 */
export async function requireOwnership(
    ctx: QueryCtx | MutationCtx,
    resourceUserId: Id<"users">
) {
    const user = await getRequiredUser(ctx);
    const userId = user._id;

    if (userId !== resourceUserId) {
        throw new Error("Access denied: You don't own this resource");
    }

    return userId;
}

/**
 * Verify user has access to a service request
 * (either as customer or assigned shop owner)
 */
export async function requireRequestAccess(
    ctx: QueryCtx | MutationCtx,
    requestId: Id<"service_requests">
) {
    const user = await getRequiredUser(ctx);
    const userId = user._id;

    const request = await ctx.db.get(requestId);
    if (!request) {
        throw new Error("Request not found");
    }

    const hasAccess =
        request.customerId === userId ||
        request.shopOwnerId === userId ||
        (user?.role === "shop_owner" && request.status === "pending");

    if (!hasAccess) {
        throw new Error("Access denied: You don't have access to this request");
    }

    return { request, user };
}

/**
 * Check if user is active
 */
export async function requireActiveUser(ctx: QueryCtx | MutationCtx) {
    const user = await getRequiredUser(ctx);

    if (!user.isActive) {
        throw new Error("Account is inactive. Please contact support.");
    }

    return user;
}
