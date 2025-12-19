import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
const http = httpRouter();

/**
 * Razorpay Webhook Handler
 * Handles payment success/failure notifications from Razorpay
 */
http.route({
    path: "/razorpay/webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        try {
            const signature = request.headers.get("x-razorpay-signature");
            const body = await request.text();

            if (!signature) {
                return new Response("Missing signature", { status: 400 });
            }

            // Verify webhook signature
            const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
            if (!webhookSecret) {
                console.error("Razorpay webhook secret not configured");
                return new Response("Configuration error", { status: 500 });
            }

            // Import crypto for verification
            const crypto = await import("crypto");
            const expectedSignature = crypto
                .createHmac("sha256", webhookSecret)
                .update(body)
                .digest("hex");

            if (signature !== expectedSignature) {
                console.error("Invalid webhook signature");
                return new Response("Invalid signature", { status: 401 });
            }

            // Parse webhook payload
            const payload = JSON.parse(body);
            const event = payload.event;

            // Handle different webhook events
            switch (event) {
                case "payment.captured":
                    // Payment was successful
                    console.log("Payment captured:", payload.payload.payment.entity);
                    // You can add additional processing here if needed
                    break;

                case "payment.failed":
                    // Payment failed
                    console.log("Payment failed:", payload.payload.payment.entity);
                    // You can add additional processing here if needed
                    break;

                case "order.paid":
                    // Order was paid
                    console.log("Order paid:", payload.payload.order.entity);
                    break;

                default:
                    console.log("Unhandled webhook event:", event);
            }

            return new Response(JSON.stringify({ received: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        } catch (error) {
            console.error("Webhook processing error:", error);
            return new Response("Internal server error", { status: 500 });
        }
    }),
});

/**
 * Health check endpoint
 */
http.route({
    path: "/health",
    method: "GET",
    handler: httpAction(async () => {
        return new Response(
            JSON.stringify({
                status: "healthy",
                timestamp: new Date().toISOString(),
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    }),
});

export default http;
