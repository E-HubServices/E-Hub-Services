import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getRequiredUser } from "./utils/auth";

// Generate upload URL for files
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getRequiredUser(ctx);
    const userId = user._id;

    return await ctx.storage.generateUploadUrl();
  },
});

// Save file metadata after upload
export const saveFileMetadata = mutation({
  args: {
    storageId: v.id("_storage"),
    originalName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getRequiredUser(ctx);
    const userId = user._id;

    // Validate file type and size
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
      "image/webp"
    ];

    if (!allowedTypes.includes(args.fileType)) {
      throw new Error("File type not allowed. Please upload images (JPEG, PNG, WebP) or PDF files.");
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (args.fileSize > maxSize) {
      throw new Error("File size too large. Maximum size is 10MB.");
    }

    const metadataId = await ctx.db.insert("file_metadata", {
      storageId: args.storageId,
      originalName: args.originalName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      uploadedBy: userId,
      isProcessed: false,
    });

    // If it's an image, schedule conversion to PDF
    if (args.fileType.startsWith("image/")) {
      // Note: In a real implementation, you would schedule an action to convert image to PDF
      // For now, we'll mark it as processed
      await ctx.db.patch(metadataId, { isProcessed: true });
    }

    return metadataId;
  },
});

// Get file metadata
export const getFileMetadata = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const user = await getRequiredUser(ctx);
    const userId = user._id;

    const metadata = await ctx.db
      .query("file_metadata")
      .withIndex("by_storage_id", (q) => q.eq("storageId", args.storageId))
      .first();

    if (!metadata) {
      return null;
    }

    // Get file URL
    const url = await ctx.storage.getUrl(args.storageId);

    return {
      ...metadata,
      url,
    };
  },
});

// Get user's uploaded files
export const getUserFiles = query({
  args: {},
  handler: async (ctx) => {
    const user = await getRequiredUser(ctx);
    const userId = user._id;

    const files = await ctx.db
      .query("file_metadata")
      .withIndex("by_uploader", (q) => q.eq("uploadedBy", userId))
      .order("desc")
      .collect();

    // Get URLs for all files
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        const url = await ctx.storage.getUrl(file.storageId);
        return {
          ...file,
          url,
        };
      })
    );

    return filesWithUrls;
  },
});

// Convert image to PDF (placeholder for actual implementation)
export const convertImageToPdf = action({
  args: {
    imageStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // In a real implementation, you would:
    // 1. Download the image from storage
    // 2. Use a library like pdf-lib or puppeteer to convert to PDF
    // 3. Upload the PDF back to storage
    // 4. Update the file metadata

    // For now, we'll just return the original file ID
    // This is a placeholder implementation
    return args.imageStorageId;
  },
});

// Delete file
export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const user = await getRequiredUser(ctx);
    const userId = user._id;

    const metadata = await ctx.db
      .query("file_metadata")
      .withIndex("by_storage_id", (q) => q.eq("storageId", args.storageId))
      .first();

    if (!metadata || metadata.uploadedBy !== userId) {
      throw new Error("File not found or access denied");
    }

    // Delete file from storage
    await ctx.storage.delete(args.storageId);

    // Delete metadata
    await ctx.db.delete(metadata._id);

    return { success: true };
  },
});

// Get file URL for download (for service request files)
export const getFileUrl = query({
  args: {
    storageId: v.id("_storage"),
    requestId: v.optional(v.id("service_requests"))
  },
  handler: async (ctx, args) => {
    const user = await getRequiredUser(ctx);

    // If requestId is provided, verify user has access to the request
    if (args.requestId) {
      const request = await ctx.db.get(args.requestId);

      if (!request) {
        throw new Error("Request not found");
      }

      // Check if user is the customer or the assigned shop owner
      const hasAccess =
        request.customerId === user._id ||
        request.shopOwnerId === user._id ||
        (user.role === "shop_owner" && request.status === "pending");

      if (!hasAccess) {
        throw new Error("Access denied");
      }
    }

    // Get the file URL
    const url = await ctx.storage.getUrl(args.storageId);

    return url;
  },
});

// Get all file URLs for a service request
export const getRequestFiles = query({
  args: { requestId: v.id("service_requests") },
  handler: async (ctx, args) => {
    const user = await getRequiredUser(ctx);

    const request = await ctx.db.get(args.requestId);

    if (!request) {
      throw new Error("Request not found");
    }

    // Check if user has access to this request
    const hasAccess =
      request.customerId === user._id ||
      request.shopOwnerId === user._id ||
      (user.role === "shop_owner" && request.status === "pending");

    if (!hasAccess) {
      throw new Error("Access denied");
    }

    // Get URLs for input files
    const inputFiles = await Promise.all(
      (request.inputFiles || []).map(async (fileId) => {
        const url = await ctx.storage.getUrl(fileId);
        const metadata = await ctx.db
          .query("file_metadata")
          .withIndex("by_storage_id", (q) => q.eq("storageId", fileId))
          .first();

        return {
          storageId: fileId,
          url,
          originalName: metadata?.originalName || "Unknown",
          fileType: metadata?.fileType || "application/octet-stream",
          fileSize: metadata?.fileSize || 0,
        };
      })
    );

    // Get URL for output file if it exists
    let outputFile = null;
    if (request.outputFile) {
      const url = await ctx.storage.getUrl(request.outputFile);
      const metadata = await ctx.db
        .query("file_metadata")
        .withIndex("by_storage_id", (q) => q.eq("storageId", request.outputFile!))
        .first();

      outputFile = {
        storageId: request.outputFile,
        url,
        originalName: metadata?.originalName || "Result Document",
        fileType: metadata?.fileType || "application/pdf",
        fileSize: metadata?.fileSize || 0,
      };
    }

    return {
      inputFiles,
      outputFile,
    };
  },
});
