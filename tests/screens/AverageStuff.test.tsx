/*
 These tests verify the AverageStuff component:
 shows overall averages computed from review data
 shows course-specific averages when a course filter is selected
 handles empty review lists without crashing
 averages grades using a GPA conversion (letter -> points -> average)
 Some values like "7.0" or "—" can show up multiple times in the UI
 (ex: difficulty + rating both being 7.0), so we use getAllByText in those cases.
 */

import React from "react";
import { render } from "@testing-library/react-native";
import AverageStuff from "@/components/features/reviews/review-averages/AverageStuff";
import { ReviewDisplay } from "@/services/reviewsService";

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
    // Two reviews: difficulty avg = 7.0, rating avg = 7.0
    // That means "7.0" appears twice, so we use getAllByText.
    const reviews = [
      makeReview({ courseDiff: 6, profRating: 8, grade: "A", code: "CSCI 130" }),
      makeReview({ reviewId: 2, courseDiff: 8, profRating: 6, grade: "B", code: "CSCI 130" }),
    ];

    const { getByText, getAllByText } = render(
      <AverageStuff reviews={reviews} selectedCourseCode={null} />,
    );

    getByText("Averages");
    getByText("2 reviews");

    getByText("Avg Difficulty");
    getByText("Avg Rating");
    getByText("Avg Grade");

    // "7.0" shows up for BOTH average difficulty and average rating
    const sevens = getAllByText("7.0");
    expect(sevens.length).toBeGreaterThanOrEqual(2);
  });

  it("shows course-specific averages card when selectedCourseCode is set (Option B)", () => {
    /*
     We purposely choose numbers so the course-specific average is UNIQUE:
     CSCI 130 difficulty avg = 10.0
     overall difficulty avg = (10 + 2) / 2 = 6.0
     That prevents “Found multiple elements with text: 10.0”
     */
    const reviews = [
      makeReview({ reviewId: 1, courseDiff: 10, profRating: 9, grade: "A", code: "CSCI 130" }),
      makeReview({ reviewId: 2, courseDiff: 2, profRating: 1, grade: "C", code: "MATH 75" }),
    ];

    const { getByText, queryByText } = render(
      <AverageStuff reviews={reviews} selectedCourseCode={"CSCI 130"} />,
    );

    // Overall always shows
    getByText("Averages");
    getByText("2 reviews");

    // Course-specific card should show
    getByText("Averages for CSCI 130");
    getByText("1 review");

    // Course-specific difficulty avg should be 10.0 (unique in this setup)
    getByText("10.0");

    // Overall difficulty avg should be 6.0 with our chosen numbers
    getByText("6.0");

    // Sanity: make sure we didn’t accidentally render a different course card
    expect(queryByText("Averages for MATH 75")).toBeNull();
  });

  it("does not show course-specific card when selectedCourseCode is null", () => {
    const reviews = [makeReview({ code: "CSCI 130" })];

    const { queryByText } = render(
      <AverageStuff reviews={reviews} selectedCourseCode={null} />,
    );

    expect(queryByText(/Averages for/i)).toBeNull();
  });

  it("handles empty review list safely (shows placeholders, no crash)", () => {
    const { getByText, getAllByText } = render(
      <AverageStuff reviews={[]} selectedCourseCode={null} />,
    );

    getByText("Averages");
    getByText("0 reviews");

    // "—" appears multiple times (grade, difficulty, rating), so use getAllByText
    const dashes = getAllByText("—");
    expect(dashes.length).toBeGreaterThan(0);
  });

  it("averages letter grades by converting to GPA first", () => {
    // A (4.0) + B (3.0) => 3.5 => shows A- in our mapping
    const reviews = [
      makeReview({ grade: "A", courseDiff: 5, profRating: 5 }),
      makeReview({ reviewId: 2, grade: "B", courseDiff: 5, profRating: 5 }),
    ];

    const { getByText } = render(
      <AverageStuff reviews={reviews} selectedCourseCode={null} />,
    );

    getByText("Avg Grade");
    getByText("A-");
  });

  it("ignores unknown/empty grade values instead of breaking the component", () => {
    const reviews = [
      makeReview({ grade: "" }),
      makeReview({ reviewId: 2, grade: "Z" as any }),
      makeReview({ reviewId: 3, grade: "B" }),
    ];

    const { getByText } = render(
      <AverageStuff reviews={reviews} selectedCourseCode={null} />,
    );

    // Should still render and base the grade on the valid "B"
    getByText("Avg Grade");
    getByText("B");
  });
});