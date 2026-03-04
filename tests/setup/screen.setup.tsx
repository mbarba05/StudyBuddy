import "@testing-library/jest-native/extend-expect";
import { act } from "@testing-library/react-native";
import "react-native-gesture-handler/jestSetup";

jest.mock("@react-native-async-storage/async-storage", () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("expo-image", () => {
    const React = require("react");
    const { Image } = require("react-native");

    const ExpoImage = (props: any) => <Image {...props} />;

    return {
        __esModule: true,
        Image: ExpoImage,
        default: ExpoImage,
    };
});

jest.mock("react-native-safe-area-context", () => {
    const React = require("react");
    const { View } = require("react-native");
    return {
        SafeAreaView: ({ children }: any) => <View>{children}</View>,
        useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    };
});

jest.mock("@react-navigation/bottom-tabs", () => ({
    useBottomTabBarHeight: () => 0,
}));

jest.mock("expo-haptics", () => ({
    impactAsync: jest.fn(),
    ImpactFeedbackStyle: { Heavy: "Heavy" },
}));

//Supabase mock
jest.mock("@/lib/subapase", () => ({
    __esModule: true,
    default: {
        channel: jest.fn(() => ({
            on: jest.fn(() => ({
                subscribe: jest.fn(),
            })),
        })),
        removeChannel: jest.fn(),
    },
}));

let mockParams: Record<string, any> = {};
let focusEffect: null | (() => void | (() => void)) = null;

(globalThis as any).__setRouteParams = (params: Record<string, any>) => {
    mockParams = params;
};

(globalThis as any).__runFocusEffect = async () => {
    await act(async () => {
        focusEffect?.();
    });
};

export const mockPush = jest.fn();

jest.mock("expo-router", () => ({
    Stack: { Screen: () => null },

    useLocalSearchParams: () => mockParams,
    useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),

    useFocusEffect: (cb: any) => {
        focusEffect = cb;
    },
}));

jest.mock("@expo/vector-icons", () => {
    const React = require("react");
    const { Text } = require("react-native");
    return {
        Ionicons: (props: any) => <Text {...props}>icon</Text>,
    };
});

jest.mock("uuid", () => ({ v4: () => "test-uuid" }));

// jest.setup.ts

jest.mock("react-native", () => {
    const RN = jest.requireActual("react-native");

    // Avoid "useNativeDriver is not supported" noise + keep Animated usable in tests
    RN.Animated = {
        ...RN.Animated,
        timing: () => ({ start: (cb?: any) => cb?.({ finished: true }) }),
        spring: () => ({ start: (cb?: any) => cb?.({ finished: true }) }),
        decay: () => ({ start: (cb?: any) => cb?.({ finished: true }) }),
    };

    return RN;
});

jest.spyOn(console, "log").mockImplementation(() => {});
// If you use Reanimated v3+, this helps in some setups
(globalThis as any).__reanimatedWorkletInit = () => {};
