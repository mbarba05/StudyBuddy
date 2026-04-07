import React from "react";
import { render, fireEvent, waitFor, within } from "@testing-library/react-native";

jest.mock("@/services/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: null,
  }),
}));

jest.mock("@/lib/subapase", () => ({
  __esModule: true,
  default: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { major: { name: "Computer Science" } },
      }),
    })),
  },
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: any) => {
    const React = require("react");
    const { Text } = require("react-native");
    return <Text>{name}</Text>;
  },
}));

import MatchMakingCard from "@/components/MatchMakingCard";

describe("MatchMakingCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the first photo, name, major, and year", async () => {
    const screen = render(
      <MatchMakingCard
        name="Davis"
        major="Computer Science"
        year="Sophomore"
        bio="I like hiking."
        imageUrls={[
          "https://example.com/photo1.jpg",
          "https://example.com/photo2.jpg",
        ]}
      />
    );

    expect(screen.getByText("Davis")).toBeTruthy();
    expect(screen.getByText("Computer Science")).toBeTruthy();
    expect(screen.getByText("Sophomore")).toBeTruthy();
    expect(screen.getByTestId("matchmaking-card-image").props.source.uri).toBe(
      "https://example.com/photo1.jpg"
    );
  });

  it("tapping the right zone shows the next photo", async () => {
    const screen = render(
      <MatchMakingCard
        name="Davis"
        major="Computer Science"
        year="Sophomore"
        bio="I like hiking."
        imageUrls={[
          "https://example.com/photo1.jpg",
          "https://example.com/photo2.jpg",
        ]}
      />
    );

    fireEvent.press(screen.getByTestId("photo-next-zone"));

    await waitFor(() => {
      expect(screen.getByTestId("matchmaking-card-image").props.source.uri).toBe(
        "https://example.com/photo2.jpg"
      );
    });
  });

  it("tapping the left zone after moving forward goes back to the previous photo", async () => {
    const screen = render(
      <MatchMakingCard
        name="Davis"
        major="Computer Science"
        year="Sophomore"
        bio="I like hiking."
        imageUrls={[
          "https://example.com/photo1.jpg",
          "https://example.com/photo2.jpg",
        ]}
      />
    );

    fireEvent.press(screen.getByTestId("photo-next-zone"));

    await waitFor(() => {
      expect(screen.getByTestId("matchmaking-card-image").props.source.uri).toBe(
        "https://example.com/photo2.jpg"
      );
    });

    fireEvent.press(screen.getByTestId("photo-prev-zone"));

    await waitFor(() => {
      expect(screen.getByTestId("matchmaking-card-image").props.source.uri).toBe(
        "https://example.com/photo1.jpg"
      );
    });
  });

  it("pressing Bio opens the bio modal with the user's bio", async () => {
    const screen = render(
      <MatchMakingCard
        name="Davis"
        major="Computer Science"
        year="Sophomore"
        bio="I like hiking."
        imageUrls={["https://example.com/photo1.jpg"]}
      />
    );

    fireEvent.press(screen.getByTestId("bio-button"));

    await waitFor(() => {
      expect(screen.getByTestId("bio-sheet")).toBeTruthy();
      expect(within(screen.getByTestId("bio-sheet")).getByText("I like hiking.")).toBeTruthy();
    });
  });

  it("shows fallback bio text when no bio exists", async () => {
    const screen = render(
      <MatchMakingCard
        name="Davis"
        major="Computer Science"
        year="Sophomore"
        bio={null}
        imageUrls={["https://example.com/photo1.jpg"]}
      />
    );

    fireEvent.press(screen.getByTestId("bio-button"));

    await waitFor(() => {
      expect(within(screen.getByTestId("bio-sheet")).getByText("No bio added yet.")).toBeTruthy();
    });
  });
});