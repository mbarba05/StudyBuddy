import React from "react";
import { render } from "@testing-library/react-native";

const mockTabsScreen = jest.fn(() => null);
const mockTabs = jest.fn(({ children }: any) => <>{children}</>);

jest.mock("expo-router", () => ({
  Redirect: ({ href }: any) => {
    const React = require("react");
    const { Text } = require("react-native");
    return <Text>{`redirect:${href}`}</Text>;
  },
  Tabs: Object.assign(
    ({ children, ...props }: any) => mockTabs({ children, ...props }),
    { Screen: (props: any) => mockTabsScreen(props) }
  ),
}));

jest.mock("@/services/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    loading: false,
  }),
}));

jest.mock("@/components/ui/Loading", () => ({
  LoadingScreen: () => {
    const React = require("react");
    const { Text } = require("react-native");
    return <Text>Loading</Text>;
  },
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: any) => {
    const React = require("react");
    const { Text } = require("react-native");
    return <Text>{name}</Text>;
  },
}));

import TabsLayout from "@/app/(app)/(tabs)/_layout";

describe("Tabs layout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the five bottom tab screens with the updated labels", () => {
    render(<TabsLayout />);

    const screenNames = mockTabsScreen.mock.calls.map((call) => call[0].name);
    const screenTitles = mockTabsScreen.mock.calls.map((call) => call[0].options.title);

    expect(screenNames).toEqual(["index", "reviews", "matchmaking", "social", "profile"]);
    expect(screenTitles).toEqual(["Home", "Reviews", "Match", "Messages", "Profile"]);
  });

  it("uses a visible tab bar with labels enabled", () => {
    render(<TabsLayout />);

    const tabsProps = mockTabs.mock.calls[0][0].screenOptions;

    expect(tabsProps.headerShown).toBe(false);
    expect(tabsProps.tabBarShowLabel).toBe(true);
  });

  it("uses the updated active and inactive tab colors", () => {
    render(<TabsLayout />);

    const tabsProps = mockTabs.mock.calls[0][0].screenOptions;

    expect(tabsProps.tabBarActiveTintColor).toBe("#db0032");
    expect(tabsProps.tabBarInactiveTintColor).toBe("#898989ff");
  });
});