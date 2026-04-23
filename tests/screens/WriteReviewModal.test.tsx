import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

// Mock button
jest.mock("@/components/ui/Buttons", () => ({
  BlueButton: ({ children, onPress }: any) => {
    const React = require("react");
    const { TouchableOpacity, Text } = require("react-native");
    return (
      <TouchableOpacity onPress={onPress}>
        <Text>{children}</Text>
      </TouchableOpacity>
    );
  },
}));

// Mock review input
jest.mock("@/components/ui/TextInputs", () => ({
  ReviewInput: ({ value, onChangeText, placeholder }: any) => {
    const React = require("react");
    const { TextInput } = require("react-native");
    return (
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
      />
    );
  },
}));

// Mock dropdown so we can set grade easily
jest.mock("react-native-dropdown-picker", () => {
  const React = require("react");
  const { TouchableOpacity, Text, View } = require("react-native");

  return ({ setValue }: any) => (
    <View>
      <TouchableOpacity onPress={() => setValue(() => "A")}>
        <Text>Set Grade</Text>
      </TouchableOpacity>
    </View>
  );
});

// Mock star rating
jest.mock("react-native-star-rating-widget", () => {
  const React = require("react");
  const { View } = require("react-native");
  return () => <View />;
});

// Mock icons
jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: any) => {
    const React = require("react");
    const { Text } = require("react-native");
    return <Text>{name}</Text>;
  },
}));

// Mock rating icons
jest.mock("@/components/features/reviews/RatingIcons", () => ({
  DifficultyIcon: () => null,
  ProfessorQualityIcon: () => null,
}));

const mockSubmitReview = jest.fn();

jest.mock("@/services/reviewsService", () => ({
  submitReview: (...args: any[]) => mockSubmitReview(...args),
}));

import WriteReviewModal from "@/components/features/reviews/WriteReviewModal";

describe("WriteReviewModal", () => {
  const mockSetVisible = jest.fn();
  const mockOnSubmit = jest.fn();

  const selectedEnrollment = {
    enrollmentId: 55,
    course: { code: "CSCI 130" },
    prof: { name: "Professor Test" },
    term: "Spring 2026",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitReview.mockResolvedValue({ id: 1 });
  });

  it("shows an error when review text is empty", async () => {
    const screen = render(
      <WriteReviewModal
        visible={true}
        setVisible={mockSetVisible}
        selectedEnrollment={selectedEnrollment as any}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.press(screen.getByText("Set Grade"));
    fireEvent.press(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText("Review text cannot be empty.")).toBeTruthy();
    });

    expect(mockSubmitReview).not.toHaveBeenCalled();
  });

  it("shows an error when grade is empty", async () => {
    const screen = render(
      <WriteReviewModal
        visible={true}
        setVisible={mockSetVisible}
        selectedEnrollment={selectedEnrollment as any}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.changeText(
      screen.getByPlaceholderText(
        "Talk about your time in the course, how you liked the professor, advice, etc."
      ),
      "This class was helpful and well organized."
    );

    fireEvent.press(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText("Grade can't be empty.")).toBeTruthy();
    });

    expect(mockSubmitReview).not.toHaveBeenCalled();
  });

  it("shows an error when review text is longer than 300 characters", async () => {
    const screen = render(
      <WriteReviewModal
        visible={true}
        setVisible={mockSetVisible}
        selectedEnrollment={selectedEnrollment as any}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.changeText(
      screen.getByPlaceholderText(
        "Talk about your time in the course, how you liked the professor, advice, etc."
      ),
      "a".repeat(301)
    );

    fireEvent.press(screen.getByText("Set Grade"));
    fireEvent.press(screen.getByText("Submit"));

    await waitFor(() => {
      expect(
        screen.getByText("Review text cannot be longer than 300 chars.")
      ).toBeTruthy();
    });

    expect(mockSubmitReview).not.toHaveBeenCalled();
  });

  it("blocks submission when bad words are used", async () => {
    const screen = render(
      <WriteReviewModal
        visible={true}
        setVisible={mockSetVisible}
        selectedEnrollment={selectedEnrollment as any}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.changeText(
      screen.getByPlaceholderText(
        "Talk about your time in the course, how you liked the professor, advice, etc."
      ),
      "This professor is fucking terrible."
    );

    fireEvent.press(screen.getByText("Set Grade"));
    fireEvent.press(screen.getByText("Submit"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Please remove bad or vulgar language before submitting your review."
        )
      ).toBeTruthy();
    });

    expect(mockSubmitReview).not.toHaveBeenCalled();
  });

  it("submits successfully when the review is valid and clean", async () => {
    const screen = render(
      <WriteReviewModal
        visible={true}
        setVisible={mockSetVisible}
        selectedEnrollment={selectedEnrollment as any}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.changeText(
      screen.getByPlaceholderText(
        "Talk about your time in the course, how you liked the professor, advice, etc."
      ),
      "Great professor, clear lectures, and fair grading."
    );

    fireEvent.press(screen.getByText("Set Grade"));
    fireEvent.press(screen.getByText("Submit"));

    await waitFor(() => {
      expect(mockSubmitReview).toHaveBeenCalledWith({
        enrollmentId: 55,
        review: "Great professor, clear lectures, and fair grading.",
        grade: "A",
        courseDiff: 5,
        profRating: 5,
      });
    });

    expect(mockOnSubmit).toHaveBeenCalled();
    expect(mockSetVisible).toHaveBeenCalledWith(false);
  });

  it("shows a submission error when submitReview fails", async () => {
    mockSubmitReview.mockResolvedValue(null);

    const screen = render(
      <WriteReviewModal
        visible={true}
        setVisible={mockSetVisible}
        selectedEnrollment={selectedEnrollment as any}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.changeText(
      screen.getByPlaceholderText(
        "Talk about your time in the course, how you liked the professor, advice, etc."
      ),
      "Helpful class and strong instructor."
    );

    fireEvent.press(screen.getByText("Set Grade"));
    fireEvent.press(screen.getByText("Submit"));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to submit review. Please try again later.")
      ).toBeTruthy();
    });
  });
});