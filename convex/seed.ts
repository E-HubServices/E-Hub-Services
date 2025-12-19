import { mutation } from "./_generated/server";

type SeedService = [string, string, string, string, number, string[]];

export const seedOnlineOnlyServices = mutation({
    args: {},
    handler: async (ctx) => {

        /* ------------------ CATEGORIES ------------------ */
        const categories = [
            "Revenue Certificates",
            "Community & Nativity",
            "Legal & Family",
            "Pension & Welfare",
            "Birth & Death Certificates",
            "Utility & Bill Payments",
            "Municipal & Tax",
            "Education Services",
        ];

        const categoryMap: Record<string, any> = {};

        for (const name of categories) {
            const existing = await ctx.db
                .query("service_categories")
                .filter(q => q.eq(q.field("name"), name))
                .first();

            categoryMap[name] = existing?._id ??
                await ctx.db.insert("service_categories", {
                    name,
                    description: `${name} – Online document-based services`,
                    isActive: true,
                });
        }

        /* ------------------ SERVICES ------------------ */
        const services: SeedService[] = [
            ["Revenue Certificates", "Revenue", "REV-101", "Income Certificate", 60, ["Aadhaar", "Income Proof"]],
            ["Revenue Certificates", "Revenue", "REV-102", "Community Certificate", 60, ["Aadhaar", "Community Proof"]],
            ["Revenue Certificates", "Revenue", "REV-103", "Nativity Certificate", 60, ["Aadhaar", "Residence Proof"]],
            ["Legal & Family", "Revenue", "LEG-201", "Legal Heir Certificate", 60, ["Aadhaar", "Death Certificate"]],
            ["Pension & Welfare", "Social Welfare", "PEN-301", "Old Age Pension Application", 10, ["Aadhaar", "Bank Passbook"]],
            ["Birth & Death Certificates", "Municipality", "BD-401", "Birth Certificate Print", 60, ["Birth Reg No"]],
            ["Utility & Bill Payments", "TANGEDCO", "UTL-501", "Electricity Bill Payment", 60, ["Consumer No"]],
            ["Municipal & Tax", "Municipality", "TAX-601", "Property Tax Payment", 60, ["Property ID"]],
            ["Education Services", "TNEA", "EDU-701", "TNEA Online Registration", 60, ["Aadhaar", "Marksheets"]],
        ];

        for (const [category, dept, code, name, price, docs] of services) {
            const exists = await ctx.db
                .query("services")
                .filter(q => q.eq(q.field("serviceCode"), code))
                .first();

            if (!exists) {
                await ctx.db.insert("services", {
                    categoryId: categoryMap[category],
                    department: dept,
                    serviceCode: code,
                    name,
                    description: `${name} (Online service)`,
                    price,
                    processingTime: "2–7 working days",
                    requiredDocuments: docs,
                    isActive: true,
                });
            }
        }

        return "✅ Online-only e-Sevai services seeded successfully";
    },
});
