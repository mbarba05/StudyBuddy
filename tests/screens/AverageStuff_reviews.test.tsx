import AverageStuff from "@/components/features/reviews/review-averages/AverageStuff";
import { ReviewDisplay } from "@/services/reviewsService";
import { render } from "@testing-library/react-native";
import React from "react";

/// here im testing the review screen. Im testing when the button "ALL" is selected it shows the
/// total professor review and when a course is selected it hide the total review and replaces it with
/// couse total review.
jest.mock("@/components/features/reviews/ProfessorSummaryBox", () => {
    return function MockProfessorSummaryBox() {
        return null;
    };
});

function makeReview(overrides: Partial<ReviewDisplay> = {}): ReviewDisplay {
    return {
        reviewId: overrides.reviewId ?? 1,
        reviewText: overrides.reviewText ?? "Class is fun",
        courseDiff: overrides.courseDiff ?? 7,
        profRating: overrides.profRating ?? 8,
        term: overrides.term ?? "Fall 2025",
        likes: overrides.likes ?? 0,
        profName: overrides.profName ?? "Prof",
        code: overrides.code ?? "CSCI 152",
        reviewDate: overrides.reviewDate ?? "2/25/2026",
        grade: overrides.grade ?? "A",
        voteScore: overrides.voteScore ?? 0,
        myVote: overrides.myVote ?? 0,
    };
}

describe("AverageStuff review totals", () => {
    it('shows professor total review count when "ALL" is selected', () => {
        const reviews = [
            makeReview({ code: "CSCI 152" }),
            makeReview({ reviewId: 2, code: "CSCI 152" }),
            makeReview({ reviewId: 3, code: "CSCI 117" }),
        ];

        const { getByText } = render(
            <AverageStuff reviews={reviews} selectedCourseCode={null} profId={1} professorName="Prof" />,
        );

        getByText("Total Averages for Professor");
        getByText("3 reviews");
    });

    it("show selected course averages", () => {
        const reviews = [
            makeReview({ code: "CSCI 152" }),
            makeReview({ reviewId: 2, code: "CSCI 152" }),
            makeReview({ reviewId: 3, code: "CSCI 117" }),
        ];

        const { getByText, queryByText } = render(
            <AverageStuff reviews={reviews} selectedCourseCode="CSCI 152" profId={1} professorName="Prof" />,
        );
        getByText("Averages for CSCI 152");
        getByText("2 reviews");
        expect(queryByText("Total Averages for Professor")).toBeNull();
    });
});
