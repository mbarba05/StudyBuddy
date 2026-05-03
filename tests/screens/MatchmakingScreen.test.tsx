import React from "react";
import { render, waitFor } from "@testing-library/react-native";

// Capture props passed into MatchMakingCard
const mockCardProps = jest.fn();

jest.mock("@/components/MatchMakingCard", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return (props: any) => {
    mockCardProps(props);
    return <Text testID="matchmaking-card">CARD</Text>;
  };
});

jest.mock("@/components/ui/Loading", () => ({
  LoadingScreen: () => {
    const React = require("react");
    const { Text } = require("react-native");
    return <Text testID="loading">Loading</Text>;
  },
}));

jest.mock("@/services/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1", display_name: "MB" },
  }),
}));

const mockGetPotentialMatches = jest.fn();
jest.mock("@/services/profileService", () => ({
  getPotentialMatches: (...args: any[]) => mockGetPotentialMatches(...args),
}));

const mockGetSwipeStatus = jest.fn();
const mockRecordSwipe = jest.fn();

jest.mock("@/services/swipeService", () => ({
  getSwipeStatus: (...args: any[]) => mockGetSwipeStatus(...args),
  recordSwipe: (...args: any[]) => mockRecordSwipe(...args),
  SwipeLimitErr: class SwipeLimitErr extends Error {},
}));

const mockSendFriendRequest = jest.fn();
jest.mock("@/services/friendshipsService", () => ({
  sendFriendRequest: (...args: any[]) => mockSendFriendRequest(...args),
}));

jest.mock("react-native-deck-swiper", () => {
  const React = require("react");
  const { View } = require("react-native");
  return ({ cards, renderCard }: any) => (
    <View>{cards?.length ? renderCard(cards[0]) : null}</View>
  );
});

jest.mock("@/services/PushNotifications", () => ({
  sendMatchNotification: jest.fn(),
}));

import MatchmakingScreen from "@/app/(app)/(tabs)/matchmaking/index";

describe("MatchmakingScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetSwipeStatus.mockResolvedValue({ remaining: 14, resetAtISO: undefined });

    mockGetPotentialMatches.mockResolvedValue([
      {
        user_id: "target-1",
        display_name: "Davis",
        year: "Sophomore",
        pp_url: "https://example.com/main.jpg",
        photo_urls: [
          "https://example.com/extra1.jpg",
          "https://example.com/extra2.jpg",
        ],
        bio: "I like hiking.",
        major: { id: 1, name: "Computer Science" },
      },
    ]);
  });

  it("passes bio and combined imageUrls into MatchMakingCard", async () => {
    const screen = render(<MatchmakingScreen />);

    await waitFor(() => expect(mockGetPotentialMatches).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByTestId("loading")).toBeNull());
    await waitFor(() => expect(mockCardProps).toHaveBeenCalled());

    const last = mockCardProps.mock.calls[mockCardProps.mock.calls.length - 1][0];

    expect(last.name).toBe("Davis");
    expect(last.major).toBe("Computer Science");
    expect(last.year).toBe("Sophomore");
    expect(last.bio).toBe("I like hiking.");
    expect(last.imageUrls).toEqual([
      "https://example.com/main.jpg",
      "https://example.com/extra1.jpg",
      "https://example.com/extra2.jpg",
    ]);
  });

  it("passes only the main photo when no extra photos exist", async () => {
    mockGetPotentialMatches.mockResolvedValueOnce([
      {
        user_id: "target-1",
        display_name: "Davis",
        year: "Sophomore",
        pp_url: "https://example.com/main.jpg",
        photo_urls: [],
        bio: "I like hiking.",
        major: { id: 1, name: "Computer Science" },
      },
    ]);

    const screen = render(<MatchmakingScreen />);

    await waitFor(() => expect(mockGetPotentialMatches).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByTestId("loading")).toBeNull());
    await waitFor(() => expect(mockCardProps).toHaveBeenCalled());

    const last = mockCardProps.mock.calls[mockCardProps.mock.calls.length - 1][0];

    expect(last.imageUrls).toEqual(["https://example.com/main.jpg"]);
  });
});