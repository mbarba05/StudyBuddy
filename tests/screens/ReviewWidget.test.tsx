import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

import { colors } from "@/assets/colors";
import ReviewWidget from "@/components/features/reviews/ReviewWidget";

// ---- mock vote service ----
const mockVoteOnReview = jest.fn();

jest.mock("@/services/reviewsService", () => ({
  voteOnReview: (...args: any[]) => mockVoteOnReview(...args),
}));

type ReviewDisplayLike = {
  reviewId: string;

  // NEW cycle fields in your widget
  voteScore: number;
  myVote?: -1 | 0 | 1;

  // fields rendered by the widget
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
  profName: "John Smith", // IMPORTANT: parseLastName requires a real string
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
    // Your test setup mocks Ionicons as <Text {...props}>icon</Text>
    // So we can find both icons via the text "icon" and inspect their props.
    const icons = screen.getAllByText("icon");
    expect(icons.length).toBe(2);
    const [upIcon, downIcon] = icons;
    return { upIcon, downIcon };
  }

  it("renders initial voteScore and uses neutral colors when myVote is 0/undefined", () => {
    const screen = render(
      <ReviewWidget review={makeReview({ voteScore: 3, myVote: 0 }) as any} />
    );

    // single total vote count displayed
    expect(screen.getByText("3")).toBeTruthy();

    const { upIcon, downIcon } = getIcons(screen);
    expect(upIcon).toHaveProp("color", colors.text);
    expect(downIcon).toHaveProp("color", colors.text);
  });

  it("upvote: calls voteOnReview(reviewId, 1), updates voteScore, and turns up arrow green", async () => {
    mockVoteOnReview.mockResolvedValueOnce({ vote_score: 1, my_vote: 1 });

    const screen = render(
      <ReviewWidget review={makeReview({ voteScore: 0, myVote: 0 }) as any} />
    );
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

    const screen = render(
      <ReviewWidget review={makeReview({ voteScore: 0, myVote: 0 }) as any} />
    );
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
    // already upvoted
    const screen = render(
      <ReviewWidget review={makeReview({ voteScore: 1, myVote: 1 }) as any} />
    );

    // backend returns neutral state (vote removed)
    mockVoteOnReview.mockResolvedValueOnce({ vote_score: 0, my_vote: 0 });

    const { upBtn } = getVoteButtons(screen);

    await act(async () => {
      fireEvent.press(upBtn); // press up again
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
    const screen = render(
      <ReviewWidget review={makeReview({ voteScore: 1, myVote: 1 }) as any} />
    );

    // typical result after switching from up to down
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
    const screen = render(
      <ReviewWidget review={makeReview({ voteScore: -1, myVote: -1 }) as any} />
    );

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
      <ReviewWidget
        review={makeReview({ voteScore: -4, myVote: 0 }) as any}
        onVoted={onVoted}
      />
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

    // initial state
    expect(screen.getByText("2")).toBeTruthy();
    expect(getIcons(screen).upIcon).toHaveProp("color", colors.success);

    // simulate parent refresh from backend
    const r2 = makeReview({ voteScore: 2, myVote: -1 });
    screen.rerender(<ReviewWidget review={r2 as any} />);

    await waitFor(() => {
      const { upIcon, downIcon } = getIcons(screen);
      expect(upIcon).toHaveProp("color", colors.text);
      expect(downIcon).toHaveProp("color", colors.error);
    });
  });
});
