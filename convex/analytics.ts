import { query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./utils/auth";

export const getOwnerAnalytics = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user || user.role !== "shop_owner") {
            throw new Error("Unauthorized");
        }

        const allRequests = await ctx.db.query("service_requests").collect();
        const allPayments = await ctx.db.query("payments").filter(q => q.eq(q.field("status"), "paid")).collect();

        // Calculate revenue
        const totalRevenue = allPayments.reduce((acc, p) => acc + (p.amount / 100), 0);

        // Filter by time periods (last 30 days)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recentRevenue = allPayments
            .filter(p => p._creationTime > thirtyDaysAgo)
            .reduce((acc, p) => acc + (p.amount / 100), 0);

        // Group requests by status
        const statusCounts = {
            pending: allRequests.filter(r => r.status === "pending").length,
            assigned: allRequests.filter(r => r.status === "assigned").length,
            in_progress: allRequests.filter(r => r.status === "in_progress").length,
            completed: allRequests.filter(r => r.status === "completed").length,
            cancelled: allRequests.filter(r => r.status === "cancelled").length,
        };

        // Performance analytics (requests over time - last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const startOfDay = new Date(date.setHours(0, 0, 0, 0)).getTime();
            const endOfDay = new Date(date.setHours(23, 59, 59, 999)).getTime();

            const count = allRequests.filter(r => r._creationTime >= startOfDay && r._creationTime <= endOfDay).length;
            return {
                date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                count
            };
        }).reverse();

        return {
            totalRevenue,
            recentRevenue,
            statusCounts,
            totalRequests: allRequests.length,
            weeklyPerformance: last7Days,
        };
    },
});

export const getInvoiceData = query({
    args: {
        period: v.union(v.literal("weekly"), v.literal("monthly")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || user.role !== "shop_owner") {
            throw new Error("Unauthorized");
        }

        const now = Date.now();
        let startTime = 0;

        if (args.period === "weekly") {
            startTime = now - (7 * 24 * 60 * 60 * 1000);
        } else {
            startTime = now - (30 * 24 * 60 * 60 * 1000);
        }

        const payments = await ctx.db
            .query("payments")
            .filter(q =>
                q.and(
                    q.eq(q.field("status"), "paid"),
                    q.gte(q.field("_creationTime"), startTime)
                )
            )
            .collect();

        // Enrich with service and user info
        const enriched = await Promise.all(
            payments.map(async (p) => {
                const service = await ctx.db.get(p.serviceId);
                const customer = await ctx.db.get(p.userId);
                return {
                    id: p.razorpayPaymentId || p._id,
                    date: new Date(p._creationTime).toLocaleDateString(),
                    customer: customer?.name || "Unknown",
                    service: service?.name || "Unknown",
                    amount: p.amount / 100,
                };
            })
        );

        return enriched;
    },
});
