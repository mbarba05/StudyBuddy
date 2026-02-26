/*
 These tests check that the AverageStuff component correctly:
 computes overall averages from the list of reviews
 shows a course-specific averages card when a course filter is selected
 stays safe when there are no reviews (no crash, shows placeholders)
 averages letter grades by converting them into GPA points first
 This is a unit test file: we only care about AverageStuff behavior,
 not Supabase, navigation, or the professor screen.
 */

import React from "react";
import { render } from "@testing-library/react-native";
import AverageStuff from "@/components/features/reviews/review-averages/AverageStuff";
import { ReviewDisplay } from "@/services/reviewsService";

// Helper to create consistent fake review objects without repeating boilerplate
function makeReview(overrides: Partial<ReviewDisplay> = {}): ReviewDisplay {
  return {
    reviewId: overrides.reviewId ?? 1,
    reviewText: overrides.reviewText ?? "Solid class",
    courseDiff: overrides.courseDiff ?? 7,
    profRating: overrides.profRating ?? 8,
    term: overrides.term ?? "Fall 2025",
    likes: overrides.likes ?? 0,
    profName: overrides.profName ?? "Jane Doe",
    code: overrides.code ?? "CSCI 130",
    reviewDate: overrides.reviewDate ?? "2/25/2026",
    grade: overrides.grade ?? "B",
    voteScore: overrides.voteScore ?? 0,
    myVote: overrides.myVote ?? 0,
  };
}

describe("AverageStuff", () => {
  it("renders the overall averages card and shows total review count", () => {
    // Two reviews with different values so we can verify averaging math
    const reviews = [
      makeReview({ courseDiff: 6, profRating: 8, grade: "A", code: "CSCI 130" }),
      makeReview({ reviewId: 2, courseDiff: 8, profRating: 6, grade: "B", code: "CSCI 130" }),
    ];

    const { getByText } = render(
      <AverageStuff reviews={reviews} selectedCourseCode={null} />
    );

    // Basic title is present
    getByText("Averages");

    // Total count should match length
    getByText("2 reviews");

    // Average difficulty should be (6 + 8) / 2 = 7.0
    getByText("Avg Difficulty");
    getByText("7.0");

    // Average rating should be (8 + 6) / 2 = 7.0
    getByText("Avg Rating");
    getByText("7.0");

    // Grade label should exist (letter result depends on internal mapping)
    getByText("Avg Grade");
  });

  it("shows course-specific averages card when selectedCourseCode is set (Option B)", () => {
    // Two different course codes so filtering has an effect
    const reviews = [
      makeReview({ courseDiff: 10, profRating: 10, grade: "A", code: "CSCI 130" }),
      makeReview({ reviewId: 2, courseDiff: 2, profRating: 2, grade: "C", code: "MATH 75" }),
    ];

    const { getByText } = render(
      <AverageStuff reviews={reviews} selectedCourseCode={"CSCI 130"} />
    );

    // Overall card always appears
    getByText("Averages");

    // Course-specific card appears only when a course is selected
    getByText("Averages for CSCI 130");

    // Only one review matches the selected course
    getByText("1 review");

    // Course-specific difficulty should reflect that single review (10.0)
    getByText("10.0");
  });

  it("does not show course-specific card when selectedCourseCode is null", () => {
    const reviews = [makeReview({ code: "CSCI 130" })];

    const { queryByText } = render(
      <AverageStuff reviews={reviews} selectedCourseCode={null} />
    );

    // If no course is selected, we should not see the second card title
    expect(queryByText(/Averages for/i)).toBeNull();
  });

  it("handles empty review list safely (shows placeholders, no crash)", () => {
    const { getByText } = render(
      <AverageStuff reviews={[]} selectedCourseCode={null} />
    );

    // Should still show the card and reflect 0 reviews
    getByText("Averages");
    getByText("0 reviews");

    // There are placeholder values ("—") when there is nothing to average
    getByText("—");
  });

  it("averages letter grades by converting to GPA first", () => {
    // A (4.0) and B (3.0) average to 3.5
    // Based on our mapping in AverageStuff, 3.5 becomes A-
    const reviews = [
      makeReview({ grade: "A", courseDiff: 5, profRating: 5 }),
      makeReview({ reviewId: 2, grade: "B", courseDiff: 5, profRating: 5 }),
    ];

    const { getByText } = render(
      <AverageStuff reviews={reviews} selectedCourseCode={null} />
    );

    getByText("Avg Grade");
    getByText("A-");
  });

  it("ignores unknown/empty grade values instead of breaking the component", () => {
    // Includes invalid grades; component should ignore them and still compute with valid ones
    const reviews = [
      makeReview({ grade: "" }),
      makeReview({ reviewId: 2, grade: "Z" as any }),
      makeReview({ reviewId: 3, grade: "B" }),
    ];

    const { getByText } = render(
      <AverageStuff reviews={reviews} selectedCourseCode={null} />
    );

    // Still renders and should show a grade based on the valid "B"
    getByText("Avg Grade");
    getByText("B");
  });
});