import { query } from "./_generated/server";

export const getSiteUrl = query({
    args: {},
    handler: async (ctx) => {
        return process.env.CONVEX_SITE_URL;
    },
});
