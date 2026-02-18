module.exports = {
    projects: [
        {
            displayName: "screens",
            preset: "jest-expo",
            testMatch: ["<rootDir>/tests/screens/**/*.test.ts?(x)"],
            setupFilesAfterEnv: ["<rootDir>/tests/setup/screen.setup.tsx"],
            moduleNameMapper: {
                "^@/(.*)$": "<rootDir>/$1",
            },
            transformIgnorePatterns: [
                "node_modules/(?!(" +
                    [
                        "(jest-)?react-native",
                        "@react-native",
                        "@react-navigation",
                        "expo(nent)?",
                        "@expo(nent)?/.*",
                        "expo-modules-core",
                        "expo-constants",
                        "expo-router",
                        "react-native-safe-area-context",
                        "expo-media-library",
                        "expo-file-system",
                        "expo-image-picker",
                        "expo-asset",
                        "expo-image",
                        "expo-document-picker",
                    ].join("|") +
                    ")/)",
            ],
        },
        {
            displayName: "services",
            preset: "jest-expo",
            testMatch: ["<rootDir>/tests/services/**/*.test.ts"],
            setupFilesAfterEnv: ["<rootDir>/tests/setup/service.setup.ts"],
            moduleNameMapper: {
                "^@/(.*)$": "<rootDir>/$1",
            },
        },
    ],
};
