import "dotenv/config";

export default {
    expo: {
        name: "StudyBuddy",
        slug: "studdybuddy",
        scheme: "studdybuddy",
        owner: "studybuddyfresno",
        userInterfaceStyle: "automatic",
        icon: "./assets/images/icon.png",
        android: {
            package: "com.nickd4vis.studdybuddy",
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#002e6d",
            },
        },
        ios: {
            bundleIdentifier: "com.nickd4vis.studdybuddy",
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false,
                NSPhotoLibraryAddUsageDescription: "Allow this app to save photos.",
            },
        },
        web: {
            favicon: "./assets/images/favicon.png",
        },
        splash: {
            image: "./assets/images/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#002e6d",
        },
        extra: {
            SUPABASE_URL: process.env.SUPABASE_URL,
            SUPABASE_SECRET: process.env.SUPABASE_SECRET,
            SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
            eas: {
                projectId: "660b77b5-5be5-4d39-9cb0-5c09b8f98a00",
            },
        },
        plugins: [
            "expo-router",
            "expo-web-browser",
            "expo-notifications",
            "expo-image-picker",
        ],
    },
};