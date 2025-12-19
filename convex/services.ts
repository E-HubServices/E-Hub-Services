import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all active service categories
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("service_categories")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get services by category
export const getServicesByCategory = query({
  args: { categoryId: v.id("service_categories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("services")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get all active services
export const getAllServices = query({
  args: {},
  handler: async (ctx) => {
    const services = await ctx.db
      .query("services")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Enrich with category information
    const enrichedServices = await Promise.all(
      services.map(async (service) => {
        const category = await ctx.db.get(service.categoryId);
        return {
          ...service,
          category: category?.name || "Unknown",
        };
      })
    );

    return enrichedServices;
  },
});

// Get service details by ID
export const getServiceById = query({
  args: { serviceId: v.id("services") },
  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId);
    if (!service || !service.isActive) {
      return null;
    }

    const category = await ctx.db.get(service.categoryId);
    return {
      ...service,
      category: category?.name || "Unknown",
    };
  },
});

// Create initial service categories and services (admin function)
export const seedServices = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingCategories = await ctx.db.query("service_categories").collect();
    if (existingCategories.length > 0) {
      return { message: "Services already seeded" };
    }

    // Create categories
    const revenueCategory = await ctx.db.insert("service_categories", {
      name: "Revenue Services",
      description: "Revenue department related services",
      isActive: true,
    });

    const civilCategory = await ctx.db.insert("service_categories", {
      name: "Civil Registration",
      description: "Birth, death, marriage certificates",
      isActive: true,
    });

    const pensionCategory = await ctx.db.insert("service_categories", {
      name: "Pension Services",
      description: "Pension and social security services",
      isActive: true,
    });

    const licenseCategory = await ctx.db.insert("service_categories", {
      name: "Licenses & Permits",
      description: "Trade licenses and permits",
      isActive: true,
    });

    // Create services
    const services = [
      // Revenue Services
      {
        categoryId: revenueCategory,
        department: "Revenue Department",
        serviceCode: "REV001",
        name: "Income Certificate",
        description: "Certificate of annual income for various purposes",
        price: 60,
        processingTime: "2-3 days",
        requiredDocuments: ["Aadhaar Card", "Salary Certificate", "Bank Statement"],
        isActive: true,
      },
      {
        categoryId: revenueCategory,
        department: "Revenue Department",
        serviceCode: "REV002",
        name: "Caste Certificate",
        description: "Certificate of caste for reservation purposes",
        price: 60,
        processingTime: "3-5 days",
        requiredDocuments: ["Aadhaar Card", "School Certificate", "Parent's Caste Certificate"],
        isActive: true,
      },
      {
        categoryId: revenueCategory,
        department: "Revenue Department",
        serviceCode: "REV003",
        name: "Domicile Certificate",
        description: "Certificate of permanent residence",
        price: 60,
        processingTime: "2-3 days",
        requiredDocuments: ["Aadhaar Card", "Voter ID", "Utility Bill"],
        isActive: true,
      },

      // Civil Registration
      {
        categoryId: civilCategory,
        department: "Civil Registration",
        serviceCode: "CIV001",
        name: "Birth Certificate",
        description: "Official birth certificate",
        price: 10,
        processingTime: "1-2 days",
        requiredDocuments: ["Hospital Certificate", "Parent's ID", "Address Proof"],
        isActive: true,
      },
      {
        categoryId: civilCategory,
        department: "Civil Registration",
        serviceCode: "CIV002",
        name: "Death Certificate",
        description: "Official death certificate",
        price: 10,
        processingTime: "1-2 days",
        requiredDocuments: ["Medical Certificate", "ID Proof", "Address Proof"],
        isActive: true,
      },
      {
        categoryId: civilCategory,
        department: "Civil Registration",
        serviceCode: "CIV003",
        name: "Marriage Certificate",
        description: "Official marriage certificate",
        price: 120,
        processingTime: "3-5 days",
        requiredDocuments: ["Marriage Photos", "ID Proofs", "Address Proofs", "Witnesses"],
        isActive: true,
      },

      // Pension Services
      {
        categoryId: pensionCategory,
        department: "Social Welfare",
        serviceCode: "PEN001",
        name: "Old Age Pension",
        description: "Application for old age pension scheme",
        price: 60,
        processingTime: "7-10 days",
        requiredDocuments: ["Age Proof", "Income Certificate", "Bank Details", "Aadhaar"],
        isActive: true,
      },
      {
        categoryId: pensionCategory,
        department: "Social Welfare",
        serviceCode: "PEN002",
        name: "Widow Pension",
        description: "Application for widow pension scheme",
        price: 60,
        processingTime: "7-10 days",
        requiredDocuments: ["Death Certificate", "Income Certificate", "Bank Details", "Aadhaar"],
        isActive: true,
      },

      // Licenses & Permits
      {
        categoryId: licenseCategory,
        department: "Municipal Corporation",
        serviceCode: "LIC001",
        name: "Trade License",
        description: "License for conducting business",
        price: 120,
        processingTime: "5-7 days",
        requiredDocuments: ["Shop Agreement", "ID Proof", "Address Proof", "NOC"],
        isActive: true,
      },
      {
        categoryId: licenseCategory,
        department: "Municipal Corporation",
        serviceCode: "LIC002",
        name: "Food License",
        description: "License for food business",
        price: 120,
        processingTime: "7-10 days",
        requiredDocuments: ["Shop License", "Health Certificate", "Water Test Report"],
        isActive: true,
      },
    ];

    // Insert all services
    for (const service of services) {
      await ctx.db.insert("services", service);
    }

    return { message: "Services seeded successfully" };
  },
});

// Create a new service
export const createService = mutation({
  args: {
    categoryId: v.id("service_categories"),
    department: v.string(),
    serviceCode: v.string(),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    processingTime: v.string(),
    requiredDocuments: v.array(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("services", args);
  },
});

// Update an existing service
export const updateService = mutation({
  args: {
    serviceId: v.id("services"),
    categoryId: v.optional(v.id("service_categories")),
    department: v.optional(v.string()),
    serviceCode: v.optional(v.string()),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    processingTime: v.optional(v.string()),
    requiredDocuments: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { serviceId, ...updates } = args;
    await ctx.db.patch(serviceId, updates);
  },
});

// Delete (deactivate) a service
export const deleteService = mutation({
  args: { serviceId: v.id("services") },
  handler: async (ctx, args) => {
    // Instead of hard deleting, we just deactivate
    await ctx.db.patch(args.serviceId, { isActive: false });
  },
});
