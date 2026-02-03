import "dotenv/config"; //for .env variables
export default {
    expo: {
        name: "studdybuddy",
        slug: "studdybuddy",
        scheme: "studdybuddy",
        owner: "studybuddyfresno",
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
            eas: {
                projectId: "660b77b5-5be5-4d39-9cb0-5c09b8f98a00",
            },
        },
        plugins: ["expo-router", "expo-web-browser"],
    },
};
