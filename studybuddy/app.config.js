import "dotenv/config"; //for .env variables
export default {
    expo: {
        name: "StudyBuddy",
        slug: "studybuddy",
        scheme: "studdybuddy",
        extra: {
            SUPABASE_URL: process.env.SUPABASE_URL,
            SUPABASE_SECRET: process.env.SUPABASE_SECRET,
            SUPABASE_PUBLISHABLE: process.env.SUPABASE_PUBLISHABLE,
        },
    },
};
