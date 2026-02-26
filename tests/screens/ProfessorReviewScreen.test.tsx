import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

// Capture props passed into AverageStuff
const mockAvgProps = jest.fn();

// --- Mock AverageStuff (so we can assert it rendered + see props) ---
jest.mock("@/components/features/reviews/review-averages/AverageStuff", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return (props: any) => {
    mockAvgProps(props);
    return <Text testID="avg-stuff">AVG</Text>;
  };
});

// --- Prevent NavigationContainer errors from useFocusEffect ---
jest.mock("@react-navigation/native", () => ({
  useFocusEffect: () => {}, // no-op
}));

// --- Mock router params so profId exists ---
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ profId: "1", profName: "Test Prof" }),
}));

// --- Make LoadingScreen detectable so we can wait until it disappears ---
jest.mock("@/components/ui/LoadingScreen", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return () => <Text testID="loading">Loading</Text>;
});

// --- Lightweight UI mocks ---
jest.mock("@/components/features/reviews/ReviewWidget", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ review }: any) => <Text>{review.reviewText}</Text>;
});

jest.mock("@/components/ui/Seperators", () => ({ ReviewSeparator: () => null }));

jest.mock("@/components/ui/Buttons", () => ({
  ClassFilterButton: ({ children, onPress }: any) => {
    const React = require("react");
    const { TouchableOpacity, Text } = require("react-native");
    return (
      <TouchableOpacity onPress={onPress}>
        <Text>{children}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  return { SafeAreaView: ({ children }: any) => <View>{children}</View> };
});

// --- IMPORTANT: supabase is imported as DEFAULT in your screen ---
// so the mock MUST provide { default: { auth: ... } }
jest.mock("@/lib/subapase", () => ({
  __esModule: true,
  default: {
    auth: {
      // Resolves quickly so userId becomes null and fetchReviews runs
      getSession: jest.fn(async () => ({ data: { session: null } })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

// --- Mock reviews service ---
const mockGetReviewsForProf = jest.fn();
jest.mock("@/services/reviewsService", () => ({
  getReviewsForProf: (...args: any[]) => mockGetReviewsForProf(...args),
}));

import ProfessorReviewsScreen from "@/app/(app)/(tabs)/reviews/professor/[profId]";

describe("ProfessorReviewsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetReviewsForProf.mockResolvedValue([
      {
        reviewId: 101,
        reviewText: "Great class",
        courseDiff: 7,
        profRating: 9,
        term: "Fall 2025",
        likes: 0,
        profName: "Test Prof",
        code: "CSCI 130",
        reviewDate: "1/1/2026",
        grade: "A",
        voteScore: 0,
        myVote: 0,
      },
      {
        reviewId: 102,
        reviewText: "Pretty hard",
        courseDiff: 9,
        profRating: 7,
        term: "Spring 2026",
        likes: 0,
        profName: "Test Prof",
        code: "CSCI 115",
        reviewDate: "2/1/2026",
        grade: "B",
        voteScore: 0,
        myVote: 0,
      },
    ]);
  });

  it("renders AverageStuff and passes reviews + selectedCourseCode", async () => {
    const screen = render(<ProfessorReviewsScreen />);

    // Wait until data fetch happens
    await waitFor(() => expect(mockGetReviewsForProf).toHaveBeenCalled());

    // Wait until loading screen is gone (means main UI rendered)
    await waitFor(() => expect(screen.queryByTestId("loading")).toBeNull());

    // AverageStuff should have been rendered
    await waitFor(() => expect(mockAvgProps).toHaveBeenCalled());

    const last = mockAvgProps.mock.calls[mockAvgProps.mock.calls.length - 1][0];

    expect(Array.isArray(last.reviews)).toBe(true);
    expect(last.reviews.length).toBe(2);
    expect(last.selectedCourseCode).toBeNull();
  });

  it("pressing a course filter updates selectedCourseCode passed to AverageStuff", async () => {
    const screen = render(<ProfessorReviewsScreen />);

    await waitFor(() => expect(mockGetReviewsForProf).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByTestId("loading")).toBeNull());
    await waitFor(() => expect(mockAvgProps).toHaveBeenCalled());

    fireEvent.press(screen.getByText("CSCI 130"));

    await waitFor(() => {
      const last = mockAvgProps.mock.calls[mockAvgProps.mock.calls.length - 1][0];
      expect(last.selectedCourseCode).toBe("CSCI 130");
      // NOTE: reviews passed stays ALL reviews if your screen passes reviews={reviews ?? []}
      // That matches your current [profId].tsx.
      expect(last.reviews.length).toBe(2);
    });
  });
});