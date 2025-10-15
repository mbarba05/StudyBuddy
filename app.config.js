import "dotenv/config"; //for .env variables
export default {
    expo: {
        name: "studdybuddy",
        slug: "studdybuddy",
        scheme: "studdybuddy",
        owner: "nickd4vis",
        android: {
            package: "com.nickd4vis.studdybuddy",
        },
        ios: {
            bundleIdentifier: "com.nickd4vis.studdybuddy",
        },
        extra: {
            SUPABASE_URL: process.env.SUPABASE_URL,
            SUPABASE_SECRET: process.env.SUPABASE_SECRET,
            SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
        },
    },
};
