import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { getCurrentUser } from "./utils/auth";
import { verifyRazorpaySignature } from "./utils/razorpay";
import { Id, Doc } from "./_generated/dataModel";

// Create Razorpay order
export const createPaymentOrder = action({
    args: {
        serviceId: v.id("services"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(api.users.getProfile);
        if (!user) {
            throw new Error("Authentication required");
        }
        const userId = user._id;

        // Get service details to verify price
        const service: Doc<"services"> | null = await ctx.runQuery(api.services.getServiceById, {
            serviceId: args.serviceId,
        });

        if (!service) {
            throw new Error("Service not found");
        }

        // Create Razorpay order
        const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!razorpayKeyId || !razorpayKeySecret) {
            throw new Error("Razorpay configuration missing");
        }

        const orderData = {
            amount: service.price * 100, // Convert to paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                serviceId: args.serviceId,
                userId: userId,
            },
        };

        const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64");

        const response: Response = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.description || "Failed to create order");
        }

        const order: any = await response.json();

        // Save order in database
        const paymentId: Id<"payments"> = await ctx.runMutation(api.payments.savePaymentRecord, {
            userId,
            serviceId: args.serviceId,
            razorpayOrderId: order.id,
            amount: order.amount,
            currency: order.currency,
            status: "created",
        });

        return {
            orderId: order.id,
            paymentId,
            amount: order.amount,
            currency: order.currency,
            key: razorpayKeyId,
        };
    },
});

// Verify payment
export const verifyPayment = action({
    args: {
        paymentId: v.id("payments"),
        razorpayPaymentId: v.string(),
        razorpaySignature: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(api.users.getProfile);
        if (!user) {
            throw new Error("Authentication required");
        }

        // Get payment record
        const payment: Doc<"payments"> | null = await ctx.runQuery(api.payments.getPaymentById, {
            paymentId: args.paymentId,
        });

        if (!payment) {
            throw new Error("Payment record not found");
        }

        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!razorpayKeySecret) {
            throw new Error("Razorpay secret missing");
        }

        // Verify signature
        const isValid = await verifyRazorpaySignature(
            payment.razorpayOrderId,
            args.razorpayPaymentId,
            args.razorpaySignature,
            razorpayKeySecret
        );

        if (!isValid) {
            await ctx.runMutation(api.payments.updatePaymentStatus, {
                paymentId: args.paymentId,
                status: "failed",
                failureReason: "Invalid signature",
            });
            throw new Error("Payment verification failed");
        }

        // Update payment record
        await ctx.runMutation(api.payments.updatePaymentStatus, {
            paymentId: args.paymentId,
            status: "paid",
            razorpayPaymentId: args.razorpayPaymentId,
            razorpaySignature: args.razorpaySignature,
        });

        // Create the service request
        const requestId: Id<"service_requests"> = await ctx.runMutation(api.requests.createServiceRequest, {
            serviceId: payment.serviceId,
            paymentId: args.paymentId,
        });

        return { success: true, requestId };
    },
});

// Database mutations
export const savePaymentRecord = mutation({
    args: {
        userId: v.id("users"),
        serviceId: v.id("services"),
        razorpayOrderId: v.string(),
        amount: v.number(),
        currency: v.string(),
        status: v.union(v.literal("created"), v.literal("paid"), v.literal("failed")),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("payments", args);
    },
});

export const updatePaymentStatus = mutation({
    args: {
        paymentId: v.id("payments"),
        status: v.union(v.literal("created"), v.literal("paid"), v.literal("failed")),
        razorpayPaymentId: v.optional(v.string()),
        razorpaySignature: v.optional(v.string()),
        failureReason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { paymentId, ...updates } = args;
        await ctx.db.patch(paymentId, updates);
    },
});

export const getPaymentById = query({
    args: { paymentId: v.id("payments") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.paymentId);
    },
});

export const getUserPayments = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) {
            return [];
        }

        const payments = await ctx.db
            .query("payments")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .order("desc")
            .collect();

        // Enrich with service details
        const enrichedPayments = await Promise.all(
            payments.map(async (payment) => {
                const service = await ctx.db.get(payment.serviceId);
                return {
                    ...payment,
                    serviceName: service?.name || "Unknown Service",
                };
            })
        );

        return enrichedPayments;
    },
});

// Mock payment for development flow
export const mockCreateAndVerifyPayment = mutation({
    args: {
        serviceId: v.id("services"),
        inputFiles: v.optional(v.array(v.id("_storage"))),
    },
    handler: async (ctx, args): Promise<{ success: boolean; requestId: Id<"service_requests">; paymentId: Id<"payments"> }> => {
        const user = await getCurrentUser(ctx);
        if (!user) {
            throw new Error("Authentication required");
        }
        const userId = user._id;

        // Get service details
        const service = await ctx.db.get(args.serviceId);
        if (!service) {
            throw new Error("Service not found");
        }

        // Create a 'paid' payment record directly
        const paymentId = await ctx.db.insert("payments", {
            userId,
            serviceId: args.serviceId,
            razorpayOrderId: `mock_order_${Date.now()}`,
            razorpayPaymentId: `mock_pay_${Date.now()}`,
            amount: service.price * 100,
            currency: "INR",
            status: "paid",
        });

        // Create the service request
        const requestId: Id<"service_requests"> = await ctx.runMutation(api.requests.createServiceRequest, {
            serviceId: args.serviceId,
            paymentId: paymentId,
            inputFiles: args.inputFiles,
        });

        return { success: true, requestId, paymentId };
    },
});
