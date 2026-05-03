import { reportReview } from "@/services/reviewsService";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Alert } from "react-native";

// ---- mock vote service ----
const mockVoteOnReview = jest.fn();

jest.mock("@/services/reviewsService", () => ({
    voteOnReview: (...args: any[]) => mockVoteOnReview(...args),
    reportReview: jest.fn(),
}));

// ReviewWidget imports these too — keep isolated in this file
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

/**
 * CRITICAL:
 * We render Ionicons as Text with the ICON NAME in the text.
 * That way we can select the review vote icons specifically:
 * - icon:arrow-up-circle
 * - icon:arrow-down-circle
 *
 * We also forward props so toHaveProp("color", ...) works.
 */
jest.mock("@expo/vector-icons", () => {
    const React = require("react");
    const { Text } = require("react-native");
    return {
        Ionicons: (props: any) => <Text {...props}>{`icon:${props.name}`}</Text>,
    };
});

import { colors } from "@/assets/colors";
import ReviewWidget from "@/components/features/reviews/ReviewWidget";

type ReviewDisplayLike = {
    reviewId: string | number;
    voteScore: number;
    myVote?: -1 | 0 | 1;

    code: string;
    profName: string;
    term: string;
    reviewDate: string;
    reviewText: string;
    courseDiff: number;
    profRating: number;
    grade: string;
};

const makeReview = (overrides: Partial<ReviewDisplayLike> = {}): ReviewDisplayLike => ({
    reviewId: "r1",
    voteScore: 0,
    myVote: 0,

    code: "CSCI 130",
    profName: "John Smith",
    term: "Spring 2026",
    reviewDate: "2026-02-16",
    reviewText: "Good overall.",
    courseDiff: 6,
    profRating: 8,
    grade: "A",
    ...overrides,
});

describe("ReviewWidget (voteScore + myVote colors + delete)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    function getVoteButtons(screen: ReturnType<typeof render>) {
        return {
            upBtn: screen.getByTestId("vote-up"),
            downBtn: screen.getByTestId("vote-down"),
        };
    }

    function getIcons(screen: ReturnType<typeof render>) {
        const upIcon = screen.getByText("icon:arrow-up-circle");
        const downIcon = screen.getByText("icon:arrow-down-circle");
        return { upIcon, downIcon };
    }

    it("renders initial voteScore and uses neutral colors when myVote is 0/undefined", () => {
        const screen = render(<ReviewWidget review={makeReview({ voteScore: 3, myVote: 0 }) as any} />);

        expect(screen.getByText("3")).toBeTruthy();

        const { upIcon, downIcon } = getIcons(screen);
        expect(upIcon).toHaveProp("color", colors.text);
        expect(downIcon).toHaveProp("color", colors.text);
    });

    it("upvote: calls voteOnReview(reviewId, 1), updates voteScore, and turns up arrow green", async () => {
        mockVoteOnReview.mockResolvedValueOnce({ vote_score: 1, my_vote: 1 });

        const screen = render(<ReviewWidget review={makeReview({ voteScore: 0, myVote: 0 }) as any} />);
        const { upBtn } = getVoteButtons(screen);

        await act(async () => {
            fireEvent.press(upBtn);
        });

        await waitFor(() => {
            expect(mockVoteOnReview).toHaveBeenCalledWith("r1", 1);
        });

        await waitFor(() => {
            expect(screen.getByText("1")).toBeTruthy();

            const { upIcon, downIcon } = getIcons(screen);
            expect(upIcon).toHaveProp("color", colors.success);
            expect(downIcon).toHaveProp("color", colors.text);
        });
    });

    it("downvote: calls voteOnReview(reviewId, -1), updates voteScore, and turns down arrow red", async () => {
        mockVoteOnReview.mockResolvedValueOnce({ vote_score: -1, my_vote: -1 });

        const screen = render(<ReviewWidget review={makeReview({ voteScore: 0, myVote: 0 }) as any} />);
        const { downBtn } = getVoteButtons(screen);

        await act(async () => {
            fireEvent.press(downBtn);
        });

        await waitFor(() => {
            expect(mockVoteOnReview).toHaveBeenCalledWith("r1", -1);
        });

        await waitFor(() => {
            expect(screen.getByText("-1")).toBeTruthy();

            const { upIcon, downIcon } = getIcons(screen);
            expect(upIcon).toHaveProp("color", colors.text);
            expect(downIcon).toHaveProp("color", colors.error);
        });
    });

    it("toggle off: pressing the same vote again removes it (myVote -> 0) and returns icons to neutral", async () => {
        const screen = render(<ReviewWidget review={makeReview({ voteScore: 1, myVote: 1 }) as any} />);

        mockVoteOnReview.mockResolvedValueOnce({ vote_score: 0, my_vote: 0 });

        const { upBtn } = getVoteButtons(screen);

        await act(async () => {
            fireEvent.press(upBtn);
        });

        await waitFor(() => {
            expect(mockVoteOnReview).toHaveBeenCalledWith("r1", 1);
        });

        await waitFor(() => {
            expect(screen.getByText("0")).toBeTruthy();

            const { upIcon, downIcon } = getIcons(screen);
            expect(upIcon).toHaveProp("color", colors.text);
            expect(downIcon).toHaveProp("color", colors.text);
        });
    });

    it("switch vote: up -> down updates myVote to -1 and updates voteScore", async () => {
        const screen = render(<ReviewWidget review={makeReview({ voteScore: 1, myVote: 1 }) as any} />);

        mockVoteOnReview.mockResolvedValueOnce({ vote_score: -1, my_vote: -1 });

        const { downBtn } = getVoteButtons(screen);

        await act(async () => {
            fireEvent.press(downBtn);
        });

        await waitFor(() => {
            expect(mockVoteOnReview).toHaveBeenCalledWith("r1", -1);
        });

        await waitFor(() => {
            expect(screen.getByText("-1")).toBeTruthy();

            const { upIcon, downIcon } = getIcons(screen);
            expect(upIcon).toHaveProp("color", colors.text);
            expect(downIcon).toHaveProp("color", colors.error);
        });
    });

    it("switch vote: down -> up updates myVote to 1 and updates voteScore", async () => {
        const screen = render(<ReviewWidget review={makeReview({ voteScore: -1, myVote: -1 }) as any} />);

        mockVoteOnReview.mockResolvedValueOnce({ vote_score: 1, my_vote: 1 });

        const { upBtn } = getVoteButtons(screen);

        await act(async () => {
            fireEvent.press(upBtn);
        });

        await waitFor(() => {
            expect(mockVoteOnReview).toHaveBeenCalledWith("r1", 1);
        });

        await waitFor(() => {
            expect(screen.getByText("1")).toBeTruthy();

            const { upIcon, downIcon } = getIcons(screen);
            expect(upIcon).toHaveProp("color", colors.success);
            expect(downIcon).toHaveProp("color", colors.text);
        });
    });

    it("delete rule: when voteOnReview returns deleted=true, it calls onVoted()", async () => {
        const onVoted = jest.fn();
        mockVoteOnReview.mockResolvedValueOnce({ deleted: true });

        const screen = render(
            <ReviewWidget review={makeReview({ voteScore: -4, myVote: 0 }) as any} onVoted={onVoted} />,
        );

        const { downBtn } = getVoteButtons(screen);

        await act(async () => {
            fireEvent.press(downBtn);
        });

        await waitFor(() => {
            expect(mockVoteOnReview).toHaveBeenCalledWith("r1", -1);
        });

        await waitFor(() => {
            expect(onVoted).toHaveBeenCalledTimes(1);
        });
    });

    it("syncs state when parent refreshes props (voteScore + myVote)", async () => {
        const r1 = makeReview({ voteScore: 2, myVote: 1 });
        const screen = render(<ReviewWidget review={r1 as any} />);

        expect(screen.getByText("2")).toBeTruthy();
        expect(getIcons(screen).upIcon).toHaveProp("color", colors.success);

        const r2 = makeReview({ voteScore: 2, myVote: -1 });
        screen.rerender(<ReviewWidget review={r2 as any} />);

        await waitFor(() => {
            const { upIcon, downIcon } = getIcons(screen);
            expect(upIcon).toHaveProp("color", colors.text);
            expect(downIcon).toHaveProp("color", colors.error);
        });
    });
});

// -------------------------------------------------------------------
// ------------------- testing report button -------------------------
// -------------------------------------------------------------------

// mocking reportReview function ... added it to the function on the top of the file to reduce dupicates
// jest.mock("@/services/reviewsService", () => ({
//   reportReview: jest.fn(),
// }));

// mocking Alert
jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("ReviewWidget Report Button", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("opens Report text box when Report Button is pressed", () => {
        const screen = render(<ReviewWidget review={makeReview({ reviewId: "r1" }) as any} />);

        fireEvent.press(screen.getByText("Report"));
        expect(screen.getByTestId("report-reason")).toBeTruthy();
    });

    it("Report is confirmed while text box has text. it closes text box once confirmed", async () => {
        (reportReview as jest.Mock).mockResolvedValueOnce({
            error: null,
        });

        const screen = render(<ReviewWidget review={makeReview({ reviewId: 1 }) as any} />);

        fireEvent.press(screen.getByText("Report"));

        fireEvent.changeText(screen.getByTestId("report-reason"), "This review is false");

        fireEvent.press(screen.getByTestId("submit-report-button"));

        await waitFor(() => {
            expect(reportReview).toHaveBeenCalledWith(1, "This review is false");
        });

        await waitFor(() => {
            expect(screen.queryByTestId("report-modal")).toBeNull();
        });

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalled();
        });
    });
});
