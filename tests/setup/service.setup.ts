jest.mock("expo-constants", () => ({
    expoConfig: {
        extra: {
            SUPABASE_URL: "http://localhost",
            SUPABASE_SECRET: "test-secret",
            SUPABASE_PUBLISHABLE_KEY: "test-key",
        },
    },
}));

jest.mock("@react-native-async-storage/async-storage", () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
