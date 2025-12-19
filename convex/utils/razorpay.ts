/**
 * Razorpay Integration Utilities
 * Handles payment order creation and signature verification
 */

export interface RazorpayOrderData {
    amount: number; // Amount in paise
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
}

export interface RazorpayOrder {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    attempts: number;
    notes: Record<string, string>;
    created_at: number;
}

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(
    orderData: RazorpayOrderData,
    keyId: string,
    keySecret: string
): Promise<RazorpayOrder> {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create Razorpay order: ${error}`);
    }

    return await response.json();
}

/**
 * Verify Razorpay payment signature
 * This is CRITICAL for security - ensures payment is legitimate
 */
export async function verifyRazorpaySignature(
    orderId: string,
    paymentId: string,
    signature: string,
    keySecret: string
): Promise<boolean> {
    try {
        const crypto = await import("crypto");
        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(`${orderId}|${paymentId}`)
            .digest("hex");

        // Use timing-safe comparison to prevent timing attacks
        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature),
            Buffer.from(signature)
        );
    } catch (error) {
        console.error("Signature verification error:", error);
        return false;
    }
}

/**
 * Fetch payment details from Razorpay
 */
export async function fetchPaymentDetails(
    paymentId: string,
    keyId: string,
    keySecret: string
) {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const response = await fetch(
        `https://api.razorpay.com/v1/payments/${paymentId}`,
        {
            method: "GET",
            headers: {
                Authorization: `Basic ${auth}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch payment details: ${error}`);
    }

    return await response.json();
}

/**
 * Initiate a refund
 */
export async function initiateRefund(
    paymentId: string,
    amount: number,
    keyId: string,
    keySecret: string
) {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const response = await fetch(
        `https://api.razorpay.com/v1/payments/${paymentId}/refund`,
        {
            method: "POST",
            headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ amount }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to initiate refund: ${error}`);
    }

    return await response.json();
}

/**
 * Validate Razorpay webhook signature
 */
export async function validateWebhookSignature(
    payload: string,
    signature: string,
    webhookSecret: string
): Promise<boolean> {
    try {
        const crypto = await import("crypto");
        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(payload)
            .digest("hex");

        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature),
            Buffer.from(signature)
        );
    } catch (error) {
        console.error("Webhook signature validation error:", error);
        return false;
    }
}
