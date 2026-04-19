import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

import ReviewWidget from "@/components/features/reviews/ReviewWidget";

const mockGetReviewComments = jest.fn();
const mockAddReviewComment = jest.fn();
const mockVoteOnReviewComment = jest.fn();
const mockVoteOnReview = jest.fn();

jest.mock("@/services/reviewCommentsService", () => ({
  getReviewComments: (...args: any[]) => mockGetReviewComments(...args),
  addReviewComment: (...args: any[]) => mockAddReviewComment(...args),
  voteOnReviewComment: (...args: any[]) => mockVoteOnReviewComment(...args),
}));

jest.mock("@/services/reviewsService", () => ({
  voteOnReview: (...args: any[]) => mockVoteOnReview(...args),
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
  return { Ionicons: ({ name }: any) => <Text>{`icon:${name}`}</Text> };
});

const baseReview: any = {
  id: 111,
  reviewId: 111,
  code: "CSCI 115",
  profName: "John Smith",
  term: "Fall 2025",
  reviewDate: "12/01/2025",
  reviewText: "Great class",
  courseDiff: 7,
  profRating: 9,
  grade: "A",
  voteScore: 0,
  myVote: 0,
};

const row = (p: Partial<any>) => ({
  id: p.id ?? 1,
  created_at: p.created_at ?? "2026-02-01T00:00:00Z",
  review_id: 111,
  parent_comment_id: p.parent_comment_id ?? null,
  content: p.content ?? "hi",
  voteScore: p.voteScore ?? 0,
  myVote: p.myVote ?? 0,
});

describe("ReviewWidget comments + replies", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens comments and loads via getReviewComments(reviewId)", async () => {
    mockGetReviewComments.mockResolvedValueOnce([]);

    const { getByText, findByText } = render(<ReviewWidget review={baseReview} />);
    fireEvent.press(getByText("Comment"));

    await waitFor(() => expect(mockGetReviewComments).toHaveBeenCalledWith(111));
    expect(await findByText("No comments yet.")).toBeTruthy();
  });

  it("posts top-level comment via addReviewComment(reviewId, text, null) and renders it", async () => {
    mockGetReviewComments.mockResolvedValueOnce([]);
    mockAddReviewComment.mockResolvedValueOnce(row({ id: 10, content: "Top comment" }));

    const { getByText, getByPlaceholderText, findByText } = render(
      <ReviewWidget review={baseReview} />
    );

    fireEvent.press(getByText("Comment"));
    await findByText("No comments yet.");

    fireEvent.changeText(getByPlaceholderText("Leave an anonymous comment..."), "Top comment");
    fireEvent.press(getByText("Post"));

    await waitFor(() =>
      expect(mockAddReviewComment).toHaveBeenCalledWith(111, "Top comment", null)
    );

    expect(await findByText("Top comment")).toBeTruthy();
    expect(getByText(/Anonymous •/)).toBeTruthy();
  });

  it("opens reply box for a comment, submits reply, calls addReviewComment(reviewId, reply, parentId), and renders it", async () => {
    mockGetReviewComments.mockResolvedValueOnce([row({ id: 1, content: "Parent" })]);
    mockAddReviewComment.mockResolvedValueOnce(
      row({ id: 2, content: "Child", parent_comment_id: 1 })
    );

    const { getByText, getAllByText, findByText, findByPlaceholderText } = render(
      <ReviewWidget review={baseReview} />
    );

    fireEvent.press(getByText("Comment"));
    await findByText("Parent");

    fireEvent.press(getAllByText("Reply")[0]);

    const replyInput = await findByPlaceholderText(/write an anonymous reply/i);
    fireEvent.changeText(replyInput, "Child");

    const replyButtons = getAllByText("Reply");
    fireEvent.press(replyButtons[replyButtons.length - 1]);

    await waitFor(() =>
      expect(mockAddReviewComment).toHaveBeenCalledWith(111, "Child", 1)
    );

    expect(await findByText("Child")).toBeTruthy();
  });

  it("refresh reloads comments", async () => {
    mockGetReviewComments
      .mockResolvedValueOnce([]) // initial open
      .mockResolvedValueOnce([row({ id: 3, content: "After refresh" })]); // refresh

    const { getByText, findByText } = render(<ReviewWidget review={baseReview} />);

    fireEvent.press(getByText("Comment"));
    await findByText("No comments yet.");

    fireEvent.press(getByText("Refresh"));

    await waitFor(() => expect(mockGetReviewComments).toHaveBeenCalledTimes(2));
    expect(await findByText("After refresh")).toBeTruthy();
  });

  it("shows error message when getReviewComments fails", async () => {
    mockGetReviewComments.mockRejectedValueOnce(new Error("Failed to load"));

    const { getByText, findByText } = render(<ReviewWidget review={baseReview} />);
    fireEvent.press(getByText("Comment"));

    expect(await findByText("Failed to load")).toBeTruthy();
  });

  it("shows error message when addReviewComment fails", async () => {
    mockGetReviewComments.mockResolvedValueOnce([]);
    mockAddReviewComment.mockRejectedValueOnce(new Error("Failed to post"));

    const { getByText, findByText, findByPlaceholderText } = render(
      <ReviewWidget review={baseReview} />
    );

    fireEvent.press(getByText("Comment"));
    await findByText("No comments yet.");

    const input = await findByPlaceholderText(/leave an anonymous comment/i);
    fireEvent.changeText(input, "Hello");
    fireEvent.press(getByText("Post"));

    expect(await findByText(/failed to post/i)).toBeTruthy();
  });
});

describe("ReviewWidget comment voting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders comment vote buttons", async () => {
    mockGetReviewComments.mockResolvedValueOnce([
      row({ id: 10, content: "Vote me", voteScore: 0, myVote: 0 }),
    ]);

    const { getByText, findByText, getByTestId } = render(
      <ReviewWidget review={baseReview} />
    );

    fireEvent.press(getByText("Comment"));
    await findByText("Vote me");

    expect(getByTestId("comment-10-vote-up")).toBeTruthy();
    expect(getByTestId("comment-10-vote-down")).toBeTruthy();
  });

  it("upvoting a comment calls voteOnReviewComment(commentId, 1)", async () => {
    mockGetReviewComments.mockResolvedValueOnce([
      row({ id: 10, content: "Vote me", voteScore: 0, myVote: 0 }),
    ]);

    mockVoteOnReviewComment.mockResolvedValueOnce({ voteScore: 1, myVote: 1 });

    const { getByText, findByText, getByTestId } = render(
      <ReviewWidget review={baseReview} />
    );

    fireEvent.press(getByText("Comment"));
    await findByText("Vote me");

    fireEvent.press(getByTestId("comment-10-vote-up"));

    await waitFor(() =>
      expect(mockVoteOnReviewComment).toHaveBeenCalledWith(10, 1)
    );
  });

  it("downvoting a comment calls voteOnReviewComment(commentId, -1)", async () => {
    mockGetReviewComments.mockResolvedValueOnce([
      row({ id: 10, content: "Vote me", voteScore: 0, myVote: 0 }),
    ]);

    mockVoteOnReviewComment.mockResolvedValueOnce({ voteScore: -1, myVote: -1 });

    const { getByText, findByText, getByTestId } = render(
      <ReviewWidget review={baseReview} />
    );

    fireEvent.press(getByText("Comment"));
    await findByText("Vote me");

    fireEvent.press(getByTestId("comment-10-vote-down"));

    await waitFor(() =>
      expect(mockVoteOnReviewComment).toHaveBeenCalledWith(10, -1)
    );
  });

  it("tapping the same vote again still calls voteOnReviewComment (toggle handled in service)", async () => {
    mockGetReviewComments.mockResolvedValueOnce([
      row({ id: 10, content: "Vote me", voteScore: 1, myVote: 1 }),
    ]);

    mockVoteOnReviewComment.mockResolvedValueOnce({ voteScore: 0, myVote: 0 });

    const { getByText, findByText, getByTestId } = render(
      <ReviewWidget review={baseReview} />
    );

    fireEvent.press(getByText("Comment"));
    await findByText("Vote me");

    fireEvent.press(getByTestId("comment-10-vote-up"));

    await waitFor(() =>
      expect(mockVoteOnReviewComment).toHaveBeenCalledWith(10, 1)
    );
  });

  it("does not crash if voteOnReviewComment rejects", async () => {
    mockGetReviewComments.mockResolvedValueOnce([
      row({ id: 10, content: "Vote me", voteScore: 0, myVote: 0 }),
    ]);

    mockVoteOnReviewComment.mockRejectedValueOnce(new Error("Vote failed"));

    const { getByText, findByText, getByTestId } = render(
      <ReviewWidget review={baseReview} />
    );

    fireEvent.press(getByText("Comment"));
    await findByText("Vote me");

    fireEvent.press(getByTestId("comment-10-vote-up"));

    await waitFor(() =>
      expect(mockVoteOnReviewComment).toHaveBeenCalledWith(10, 1)
    );
  });
}); 