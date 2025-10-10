import "dotenv/config"; //for .env variables
export default {
    expo: {
        name: "your-app-name",
        slug: "your-app-slug",
        scheme: "yourapp",
        extra: {
            SUPABASE_URL: process.env.SUPABASE_URL,
            SUPABASE_SECRET: process.env.SUPABASE_SECRET,
            SUPABASE_PUBLISHABLE: process.env.SUPABASE_PUBLISHABLE,
        },
    },
};
