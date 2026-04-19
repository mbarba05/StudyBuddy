import AdminReviewScreen from "@/components/features/reviews/AdminReviewScreen";
import { ReportedReview } from "@/services/reportService";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Alert } from "react-native";

const mockGetReportedReviews = jest.fn();
const mockDeleteReview = jest.fn();
const mockMarkReportsReviewed = jest.fn();

jest.mock("@/services/reportService", () => ({
    getReportedReviews: (...args: any[]) => mockGetReportedReviews(...args),
    deleteReview: (...args: any[]) => mockDeleteReview(...args),
    markReportsReviewed: (...args: any[]) => mockMarkReportsReviewed(...args),
}));

// ReviewWidget is nested inside ReportCard — stub out its transitive deps
jest.mock("@/services/reviewsService", () => ({
    voteOnReview: jest.fn(),
}));

jest.mock("@/services/reviewCommentsService", () => ({
    getReviewComments: jest.fn(),
    addReviewComment: jest.fn(),
    voteOnReviewComment: jest.fn(),
}));

jest.mock("@/assets/colors", () => ({
    colors: {
        text: "#fff",
        textSecondary: "#aaa",
        background: "#000",
        primary: "#0f0",
        secondary: "#111",
        success: "green",
        error: "red",
    },
}));

jest.mock("@/lib/utillities", () => ({
    parseLastName: (s: string) => s?.split(" ")?.slice(-1)?.[0] ?? s,
}));

jest.mock("@expo/vector-icons", () => {
    const React = require("react");
    const { Text } = require("react-native");
    return {
        Ionicons: (props: any) => <Text {...props}>{`icon:${props.name}`}</Text>,
    };
});

jest.mock("@/components/ui/Loading", () => {
    const { Text } = require("react-native");
    return { LoadingScreen: () => <Text>Loading...</Text> };
});

const makeReport = (overrides: Partial<ReportedReview> = {}): ReportedReview => ({
    reviewId: 1,
    reviewText: "This is a reported review",
    courseDiff: 5,
    profRating: 5,
    profName: "Jane Doe",
    code: "CSCI 101",
    term: "Spring 2026",
    grade: "B",
    reviewDate: "2/1/2026",
    reportCount: 2,
    reasons: ["spam", "inappropriate"],
    ...overrides,
});

describe("AdminReviewScreen", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders the screen title and an empty-state message when there are no reports", async () => {
        mockGetReportedReviews.mockResolvedValue([]);

        const screen = render(<AdminReviewScreen />);

        expect(await screen.findByText("Reported Reviews")).toBeTruthy();
        expect(await screen.findByText("No Reported Reviews")).toBeTruthy();
    });

    it("renders a ReportCard for each reported review with report count", async () => {
        mockGetReportedReviews.mockResolvedValue([
            makeReport({ reviewId: 1, code: "CSCI 101", reportCount: 3 }),
            makeReport({ reviewId: 2, code: "MATH 205", reportCount: 1 }),
        ]);

        const screen = render(<AdminReviewScreen />);

        expect(await screen.findByText("CSCI 101")).toBeTruthy();
        expect(await screen.findByText("MATH 205")).toBeTruthy();
        expect(await screen.findByText("3 Reports")).toBeTruthy();
        expect(await screen.findByText("1 Report")).toBeTruthy();
    });

    it("toggles the reasons dropdown when the report header is tapped", async () => {
        mockGetReportedReviews.mockResolvedValue([
            makeReport({ reviewId: 1, reasons: ["spam", "harassment"], reportCount: 2 }),
        ]);

        const screen = render(<AdminReviewScreen />);

        const header = await screen.findByText("2 Reports");

        // Reasons hidden by default
        expect(screen.queryByText("• spam")).toBeNull();
        expect(screen.queryByText("• harassment")).toBeNull();

        await act(async () => {
            fireEvent.press(header);
        });

        expect(await screen.findByText("• spam")).toBeTruthy();
        expect(await screen.findByText("• harassment")).toBeTruthy();

        // Tap again to collapse
        await act(async () => {
            fireEvent.press(header);
        });

        await waitFor(() => {
            expect(screen.queryByText("• spam")).toBeNull();
        });
    });

    it("dismisses a report: calls markReportsReviewed and removes the card from the list", async () => {
        mockGetReportedReviews.mockResolvedValue([
            makeReport({ reviewId: 42, code: "BIO 300", reportCount: 1 }),
        ]);
        mockMarkReportsReviewed.mockResolvedValue(true);

        // Auto-press the "Dismiss" confirm button in Alert
        const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((_title, _msg, buttons) => {
            const dismissBtn = buttons?.find((b) => b.text === "Dismiss");
            dismissBtn?.onPress?.();
        });

        const screen = render(<AdminReviewScreen />);

        const dismissButton = await screen.findByText("Dismiss");

        await act(async () => {
            fireEvent.press(dismissButton);
        });

        await waitFor(() => {
            expect(mockMarkReportsReviewed).toHaveBeenCalledWith(42);
        });

        await waitFor(() => {
            expect(screen.queryByText("BIO 300")).toBeNull();
        });

        alertSpy.mockRestore();
    });

    it("deletes a review: calls deleteReview + markReportsReviewed and removes the card", async () => {
        mockGetReportedReviews.mockResolvedValue([
            makeReport({ reviewId: 99, code: "PHYS 201", reportCount: 5 }),
        ]);
        mockDeleteReview.mockResolvedValue(true);
        mockMarkReportsReviewed.mockResolvedValue(true);

        const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((_title, _msg, buttons) => {
            const deleteBtn = buttons?.find((b) => b.text === "Delete");
            deleteBtn?.onPress?.();
        });

        const screen = render(<AdminReviewScreen />);

        const deleteButton = await screen.findByText("Delete");

        await act(async () => {
            fireEvent.press(deleteButton);
        });

        await waitFor(() => {
            expect(mockDeleteReview).toHaveBeenCalledWith(99);
            expect(mockMarkReportsReviewed).toHaveBeenCalledWith(99);
        });

        await waitFor(() => {
            expect(screen.queryByText("PHYS 201")).toBeNull();
        });

        alertSpy.mockRestore();
    });
});
