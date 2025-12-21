import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, getRequiredUser } from "./utils/auth";
import { createNotificationInternal } from "./notifications";

// Record a signed self-declaration
export const submitSelfDeclaration = mutation({
  args: {
    serviceRequestId: v.id("service_requests"),
    signatureStorageId: v.id("_storage"),
    signedPdfStorageId: v.id("_storage"),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getRequiredUser(ctx);

    const request = await ctx.db.get(args.serviceRequestId);
    if (!request) throw new Error("Request not found");
    // Verify user is the customer
    if (request.customerId !== user._id) {
      throw new Error("Unauthorized to sign this document");
    }

    await ctx.db.insert("signed_declarations", {
      userId: user._id,
      serviceRequestId: args.serviceRequestId,
      signatureUrl: (await ctx.storage.getUrl(args.signatureStorageId))!,
      signedPdfUrl: (await ctx.storage.getUrl(args.signedPdfStorageId))!,
      signedAt: Date.now(),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });

    // Update request status
    await ctx.db.patch(args.serviceRequestId, {
      signatureStatus: "signed",
      signedFileId: args.signedPdfStorageId,
    });

    // Notify shop owner via notification
    if (request.shopOwnerId) {
      await createNotificationInternal(ctx, {
        userId: request.shopOwnerId,
        title: "Document Signed",
        description: `Customer has signed the document for request ${args.serviceRequestId}.`,
        type: "signature_completed",
        serviceRequestId: args.serviceRequestId,
      });
    }
  },
});

// Create service request after successful payment
// Create service request after successful payment
export const createServiceRequest = mutation({
  args: {
    serviceId: v.id("services"),
    paymentId: v.id("payments"),
    customerNotes: v.optional(v.string()),
    inputFiles: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const user = await getRequiredUser(ctx);
    const userId = user._id;

    // Verify payment belongs to user and is successful
    const payment = await ctx.db.get(args.paymentId);
    if (!payment || payment.userId !== userId || payment.status !== "paid") {
      throw new Error("Invalid or unpaid payment");
    }

    // Check if request already exists for this payment
    const existingRequest = await ctx.db
      .query("service_requests")
      .filter((q) => q.eq(q.field("paymentId"), args.paymentId))
      .first();

    if (existingRequest) {
      return existingRequest._id;
    }

    const inputFiles = args.inputFiles || [];

    // Create service request
    const requestId = await ctx.db.insert("service_requests", {
      customerId: userId,
      serviceId: args.serviceId,
      paymentId: args.paymentId,
      status: "pending",
      inputFiles: inputFiles,
      customerNotes: args.customerNotes,
    });

    // Create notification for customer
    await createNotificationInternal(ctx, {
      userId: userId,
      title: "Request Created",
      description: "Service request created successfully." + (inputFiles.length > 0 ? ` Included ${inputFiles.length} document(s).` : ""),
      type: "request_created",
      serviceRequestId: requestId,
    });

    // If there are input files, create a message for them specifically so they appear in chat
    if (inputFiles.length > 0) {
      await ctx.db.insert("messages", {
        serviceRequestId: requestId,
        senderId: userId,
        text: `Initial documents uploaded (${inputFiles.length}).`,
        attachments: inputFiles,
        messageType: "file",
        isRead: false,
      });
    }

    return requestId;
  },
});

// Get customer's service requests
export const getCustomerRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      console.log("[getCustomerRequests] No user found - returning empty array");
      return [];
    }
    const userId = user._id;

    console.log("[getCustomerRequests] Fetching requests for customer:", user.email);

    const requests = await ctx.db
      .query("service_requests")
      .withIndex("by_customer", (q) => q.eq("customerId", userId))
      .order("desc")
      .collect();

    // Enrich with service and payment information
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const [service, payment] = await Promise.all([
          ctx.db.get(request.serviceId),
          ctx.db.get(request.paymentId),
        ]);

        return {
          ...request,
          service: service ? {
            name: service.name,
            serviceCode: service.serviceCode,
            department: service.department,
          } : null,
          payment: payment ? {
            amount: payment.amount,
            status: payment.status,
          } : null,
        };
      })
    );

    return enrichedRequests;
  },
});

// Get shop owner's assigned requests
export const getShopOwnerRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      console.log("[getShopOwnerRequests] No user found - returning empty array");
      return [];
    }
    const userId = user._id;

    // Verify user is shop owner
    if (user.role !== "shop_owner") {
      console.log("[getShopOwnerRequests] User is not a shop owner - returning empty array");
      return [];
    }

    console.log("[getShopOwnerRequests] Fetching requests for shop owner:", user.email);

    const requests = await ctx.db
      .query("service_requests")
      .withIndex("by_shop_owner", (q) => q.eq("shopOwnerId", userId))
      .order("desc")
      .collect();

    // Enrich with service, customer, and payment information
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const [service, customer, payment] = await Promise.all([
          ctx.db.get(request.serviceId),
          ctx.db.get(request.customerId),
          ctx.db.get(request.paymentId),
        ]);

        return {
          ...request,
          service: service ? {
            name: service.name,
            serviceCode: service.serviceCode,
            department: service.department,
          } : null,
          customer: customer ? {
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
          } : null,
          payment: payment ? {
            amount: payment.amount,
            status: payment.status,
          } : null,
        };
      })
    );

    return enrichedRequests;
  },
});

// Get pending requests for assignment
export const getPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      console.log("[getPendingRequests] No user found - returning empty array");
      return [];
    }
    const userId = user._id;

    // Verify user is shop owner
    if (user.role !== "shop_owner") {
      console.log("[getPendingRequests] User is not a shop owner - returning empty array");
      return [];
    }

    console.log("[getPendingRequests] Fetching pending requests for shop owner:", user.email);

    const requests = await ctx.db
      .query("service_requests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();

    // Enrich with service, customer, and payment information
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const [service, customer, payment] = await Promise.all([
          ctx.db.get(request.serviceId),
          ctx.db.get(request.customerId),
          ctx.db.get(request.paymentId),
        ]);

        return {
          ...request,
          service: service ? {
            name: service.name,
            serviceCode: service.serviceCode,
            department: service.department,
          } : null,
          customer: customer ? {
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
          } : null,
          payment: payment ? {
            amount: payment.amount,
            status: payment.status,
          } : null,
        };
      })
    );

    return enrichedRequests;
  },
});

// Get requests awaiting customer signatures (for shop owner dashboard)
export const getSignaturePendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // Verify user is shop owner
    if (user.role !== "shop_owner") {
      return [];
    }

    const requests = await ctx.db
      .query("service_requests")
      .withIndex("by_shop_owner", (q) => q.eq("shopOwnerId", user._id))
      .filter((q) => q.eq(q.field("signatureStatus"), "requested"))
      .order("desc")
      .collect();

    // Enrich with service, customer, and payment information
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const [service, customer, payment] = await Promise.all([
          ctx.db.get(request.serviceId),
          ctx.db.get(request.customerId),
          ctx.db.get(request.paymentId),
        ]);

        return {
          ...request,
          service: service ? {
            name: service.name,
            serviceCode: service.serviceCode,
            department: service.department,
          } : null,
          customer: customer ? {
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
          } : null,
          payment: payment ? {
            amount: payment.amount,
            status: payment.status,
          } : null,
        };
      })
    );

    return enrichedRequests;
  },
});

// Assign request to shop owner
export const assignRequest = mutation({
  args: {
    requestId: v.id("service_requests"),
  },
  handler: async (ctx, args) => {
    const user = await getRequiredUser(ctx);
    const userId = user._id;

    // Verify user is shop owner
    if (user.role !== "shop_owner") {
      throw new Error("Access denied: Shop owner role required");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Request is not available for assignment");
    }

    // Assign request to shop owner
    await ctx.db.patch(args.requestId, {
      shopOwnerId: userId,
      status: "assigned",
    });

    // Create notification for customer
    await createNotificationInternal(ctx, {
      userId: request.customerId,
      title: "Service Assigned",
      description: `Your request has been assigned to ${user.name}.`,
      type: "assignment",
      serviceRequestId: args.requestId,
    });

    return { success: true };
  },
});

// Update request status
export const updateRequestStatus = mutation({
  args: {
    requestId: v.id("service_requests"),
    status: v.union(
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    notes: v.optional(v.string()),
    estimatedCompletion: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getRequiredUser(ctx);
    const userId = user._id;

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    // Verify user is the assigned shop owner
    if (request.shopOwnerId !== userId) {
      throw new Error("Access denied: Not assigned to this request");
    }

    const updateData: any = { status: args.status };

    if (args.notes) {
      updateData.shopOwnerNotes = args.notes;
    }

    if (args.estimatedCompletion) {
      updateData.estimatedCompletion = args.estimatedCompletion;
    }

    if (args.status === "completed") {
      updateData.completedAt = Date.now();
    }

    await ctx.db.patch(args.requestId, updateData);

    const statusMessages = {
      in_progress: "Work has started on your request.",
      completed: "Your request has been completed. You can download the final document.",
      cancelled: "Your request has been cancelled.",
    };

    const statusTitles = {
      in_progress: "Processing Started",
      completed: "Request Completed",
      cancelled: "Request Cancelled",
    };

    await createNotificationInternal(ctx, {
      userId: request.customerId,
      title: statusTitles[args.status],
      description: statusMessages[args.status] + (args.notes ? ` Note: ${args.notes}` : ""),
      type: "status_update",
      serviceRequestId: args.requestId,
    });

    return { success: true };
  },
});

// Get request details by ID
export const getRequestById = query({
  args: { requestId: v.id("service_requests") },
  handler: async (ctx, args) => {
    const user = await getRequiredUser(ctx);
    const userId = user._id;

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      return null;
    }

    // Verify user has access to this request
    const hasAccess =
      request.customerId === userId ||
      request.shopOwnerId === userId ||
      (user.role === "shop_owner" && request.status === "pending");

    if (!hasAccess) {
      throw new Error("Access denied");
    }

    // Enrich with related data
    const [service, customer, shopOwner, payment] = await Promise.all([
      ctx.db.get(request.serviceId),
      ctx.db.get(request.customerId),
      request.shopOwnerId ? ctx.db.get(request.shopOwnerId) : null,
      ctx.db.get(request.paymentId),
    ]);

    return {
      ...request,
      service,
      customer: customer ? {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      } : null,
      shopOwner: shopOwner ? {
        name: shopOwner.name,
        phone: shopOwner.phone,
        email: shopOwner.email,
      } : null,
      payment,
    };
  },
});

// Add input files to request
export const addInputFiles = mutation({
  args: {
    requestId: v.id("service_requests"),
    fileIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await getRequiredUser(ctx);
    const userId = user._id;

    const request = await ctx.db.get(args.requestId);
    if (!request || request.customerId !== userId) {
      throw new Error("Request not found or access denied");
    }

    // Add files to existing input files
    const updatedFiles = [...request.inputFiles, ...args.fileIds];

    await ctx.db.patch(args.requestId, {
      inputFiles: updatedFiles,
    });

    // Create message about file upload
    await ctx.db.insert("messages", {
      serviceRequestId: args.requestId,
      senderId: userId,
      text: `Uploaded ${args.fileIds.length} document(s).`,
      attachments: args.fileIds,
      messageType: "file",
      isRead: false,
    });

    return { success: true };
  },
});

// Request customer signature
export const requestCustomerSignature = mutation({
  args: {
    requestId: v.id("service_requests"),
    fileId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await getRequiredUser(ctx);
    const userId = user._id;

    // Verify user is shop owner
    if (user.role !== "shop_owner") {
      throw new Error("Access denied: Shop owner role required");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    if (request.shopOwnerId !== userId) {
      throw new Error("Access denied: Not assigned to this request");
    }

    // Update request
    await ctx.db.patch(args.requestId, {
      signatureStatus: "requested",
      unsignedFileId: args.fileId,
    });

    // Create notification for customer
    await createNotificationInternal(ctx, {
      userId: request.customerId,
      title: "Signature Requested",
      description: "Action Required: Please sign the attached document to proceed.",
      type: "signature_request",
      serviceRequestId: args.requestId,
    });

    return { success: true };
  },
});

// Set output file for completed request
export const setOutputFile = mutation({
  args: {
    requestId: v.id("service_requests"),
    fileId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await getRequiredUser(ctx);
    const userId = user._id;

    const request = await ctx.db.get(args.requestId);
    if (!request || request.shopOwnerId !== userId) {
      throw new Error("Request not found or access denied");
    }

    await ctx.db.patch(args.requestId, {
      outputFile: args.fileId,
    });

    // Create message about output file
    await ctx.db.insert("messages", {
      serviceRequestId: args.requestId,
      senderId: userId,
      text: "Final document has been uploaded and is ready for download.",
      attachments: [args.fileId],
      messageType: "file",
      isRead: false,
    });

    return { success: true };
  },
});

