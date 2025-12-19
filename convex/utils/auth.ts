import { MutationCtx, QueryCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Get the current user from the database based on their Clerk identity.
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users"> | null> {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        return null;
    }

    return await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .unique();
}

/**
 * Helper to ensure a user is authenticated and return their database document.
 * Throws an error if not authenticated.
 */
export async function getRequiredUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
    const user = await getCurrentUser(ctx);
    if (!user) {
        throw new Error("Authentication required");
    }
    return user;
}
