import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const applicationTables = {
  // Users with role-based access
  users: defineTable({
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    tokenIdentifier: v.optional(v.string()),
    role: v.optional(v.union(v.literal("customer"), v.literal("shop_owner"), v.literal("authorized_signatory"))),
    isActive: v.optional(v.boolean()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_phone", ["phone"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // Service categories for organization
  service_categories: defineTable({
    name: v.string(),
    description: v.string(),
    isActive: v.boolean(),
  }),

  // Government services catalog
  services: defineTable({
    categoryId: v.id("service_categories"),
    department: v.string(),
    serviceCode: v.string(),
    name: v.string(),
    description: v.string(),
    price: v.number(), // Price in rupees
    processingTime: v.string(), // e.g., "2-3 days"
    requiredDocuments: v.array(v.string()),
    isActive: v.boolean(),
  })
    .index("by_category", ["categoryId"])
    .index("by_service_code", ["serviceCode"])
    .index("by_active", ["isActive"]),

  // Payment records with Razorpay integration
  payments: defineTable({
    userId: v.id("users"),
    serviceId: v.id("services"),
    razorpayOrderId: v.string(),
    razorpayPaymentId: v.optional(v.string()),
    razorpaySignature: v.optional(v.string()),
    amount: v.number(), // Amount in paise
    currency: v.string(),
    status: v.union(
      v.literal("created"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    failureReason: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_razorpay_order", ["razorpayOrderId"])
    .index("by_status", ["status"]),

  // Service requests workflow
  service_requests: defineTable({
    customerId: v.id("users"),
    shopOwnerId: v.optional(v.id("users")),
    serviceId: v.id("services"),
    paymentId: v.id("payments"),
    status: v.union(
      v.literal("pending"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    inputFiles: v.array(v.id("_storage")),
    outputFile: v.optional(v.id("_storage")),
    // For Option A specific flow: Owner requests signature -> User signs -> Owner processes
    signatureStatus: v.optional(v.union(v.literal("none"), v.literal("requested"), v.literal("signed"))),
    unsignedFileId: v.optional(v.id("_storage")), // PDF sent by owner for signing
    signedFileId: v.optional(v.id("_storage")),   // PDF signed by user
    customerNotes: v.optional(v.string()),
    shopOwnerNotes: v.optional(v.string()),
    estimatedCompletion: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_customer", ["customerId"])
    .index("by_shop_owner", ["shopOwnerId"])
    .index("by_status", ["status"])
    .index("by_service", ["serviceId"]),

  // Real-time chat messages
  messages: defineTable({
    serviceRequestId: v.optional(v.id("service_requests")),
    esignRequestId: v.optional(v.id("esign_requests")),
    senderId: v.id("users"),
    text: v.optional(v.string()),
    attachments: v.optional(v.array(v.id("_storage"))),
    messageType: v.union(
      v.literal("text"),
      v.literal("file"),
      v.literal("status_update"),
      v.literal("system")
    ),
    isRead: v.boolean(),
    // Temporary field for cleanup
    requestId: v.optional(v.any()),
  })
    .index("by_service_request", ["serviceRequestId"])
    .index("by_esign_request", ["esignRequestId"])
    .index("by_sender", ["senderId"]),

  // File metadata for better tracking
  file_metadata: defineTable({
    storageId: v.id("_storage"),
    originalName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    uploadedBy: v.id("users"),
    isProcessed: v.boolean(),
    processedFileId: v.optional(v.id("_storage")),
  })
    .index("by_storage_id", ["storageId"])
    .index("by_uploader", ["uploadedBy"]),

  // e-Sign & e-Seal Requests
  esign_requests: defineTable({
    requesterId: v.id("users"),               // user or shop
    requesterType: v.union(
      v.literal("customer"),
      v.literal("shop_owner")
    ),

    requesterDetails: v.object({
      name: v.string(),
      mobile: v.string(),
      address: v.string(),
      shopNumber: v.optional(v.string()),     // only for shop
    }),

    documentFileId: v.id("_storage"),          // uploaded PDF
    purpose: v.string(),

    requireSignature: v.boolean(),
    requireSeal: v.boolean(),

    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("signed"),
      v.literal("cancelled"),
      v.literal("pending_verification"),
      v.literal("approved")
    ),

    signedFileId: v.optional(v.id("_storage")),

    authorityDetails: v.optional(
      v.object({
        authorityId: v.string(),
        signedBy: v.string(),
        signedAt: v.number(),
      })
    ),

    rejectionReason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_requester", ["requesterId"])
    .index("by_status", ["status"]),

  // e-Sign Audit Logs
  esign_audit_logs: defineTable({
    requestId: v.id("esign_requests"),
    action: v.string(), // CREATED, APPROVED, SIGNED, DOWNLOADED, REJECTED
    performedBy: v.id("users"),
    performedAt: v.number(),
    ipAddress: v.optional(v.string()),
  })
    .index("by_request", ["requestId"]),
  // Signed Self-Declarations
  signed_declarations: defineTable({
    userId: v.id("users"),
    serviceRequestId: v.id("service_requests"),
    signatureUrl: v.string(), // Image of signature
    signedPdfUrl: v.string(), // Final PDF
    signedAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    documentHash: v.optional(v.string()),
  })
    .index("by_request", ["serviceRequestId"])
    .index("by_user", ["userId"]),

  // Notifications for users
  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    type: v.string(), // status_update, signature_request, assignment, etc.
    isRead: v.boolean(),
    isToastShown: v.boolean(),
    serviceRequestId: v.optional(v.id("service_requests")),
    esignRequestId: v.optional(v.id("esign_requests")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_read", ["isRead"]),
};

export default defineSchema(applicationTables);
