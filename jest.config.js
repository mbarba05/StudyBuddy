module.exports = {
    projects: [
        {
            displayName: "screens",
            preset: "jest-expo",
            testMatch: ["<rootDir>/tests/screens/**/*.test.ts?(x)"],
            setupFilesAfterEnv: ["<rootDir>/tests/setup/screen.setup.tsx"],
            moduleNameMapper: {
                "^@/(.*)$": "<rootDir>/$1",
                "^react-native-css-interop/jsx-runtime$":
                    "<rootDir>/node_modules/react/cjs/react-jsx-runtime.development.js",
                "^react-native-css-interop/jsx-dev-runtime$":
                    "<rootDir>/node_modules/react/cjs/react-jsx-dev-runtime.development.js",

                // your other mappings
                "^react-native-reanimated$": "<rootDir>/tests/setup/react-native-reanimated.ts",
                "^react-native-pager-view$": "<rootDir>/tests/setup/react-native-pager-view.tsx",
                "^react-native-gesture-handler$": "<rootDir>/tests/setup/react-native-gesture-handler.ts",

                // keep your css-interop mock for normal imports
                "^react-native-css-interop$": "<rootDir>/tests/setup/react-native-css-interop.js",
                "^react-native-css-interop/(.*)$": "<rootDir>/tests/setup/react-native-css-interop.js",
            },
            transformIgnorePatterns: [
                "node_modules/(?!(" +
                    [
                        "(jest-)?react-native",
                        "@react-native",
                        "@react-navigation",
                        "react-native-reanimated",
                        "react-native-css-interop",
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
            displayName: "matchMaking",
            preset: "jest-expo",
            testMatch: ["<rootDir>/tests/matchMaking/**/*.test.ts?(x)"],
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
