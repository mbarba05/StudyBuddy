import React from "react";
import { render } from "@testing-library/react-native";

jest.mock("expo-router", () => ({
  Link: ({ children }: any) => children,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: any) => {
    const React = require("react");
    const { Text } = require("react-native");
    return <Text>{name}</Text>;
  },
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
  };
});

import HomeScreen from "@/app/(app)/(tabs)/index";

describe("HomeScreen", () => {
  it("renders the homepage logo and subtitle", () => {
    const screen = render(<HomeScreen />);

    expect(screen.getByTestId("home-logo")).toBeTruthy();
    expect(screen.getByText("Study together. Achieve more.")).toBeTruthy();
  });

  it("renders the hero message", () => {
    const screen = render(<HomeScreen />);

    expect(screen.getByText("Ready to study smarter?")).toBeTruthy();
    expect(
      screen.getByText("Jump into reviews, find new study partners, or check in with your friends.")
    ).toBeTruthy();
  });

  it("renders the four homepage action cards", () => {
    const screen = render(<HomeScreen />);

    expect(screen.getByText("Reviews")).toBeTruthy();
    expect(screen.getByText("Rate and review your study sessions")).toBeTruthy();

    expect(screen.getByText("Matchmaking")).toBeTruthy();
    expect(screen.getByText("Find the perfect study buddy for you")).toBeTruthy();

    expect(screen.getByText("Messages")).toBeTruthy();
    expect(screen.getByText("Chat with your study buddies")).toBeTruthy();

    expect(screen.getByText("Profile")).toBeTruthy();
    expect(screen.getByText("View and manage your profile")).toBeTruthy();
  });
});