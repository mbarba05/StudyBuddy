import { colors } from "@/assets/colors";
import { parseLastName } from "@/lib/utillities";
import {
    addReviewComment,
    getReviewComments,
    ReviewCommentPublic,
    voteOnReviewComment,
} from "@/services/reviewCommentsService";
import { reportReview, ReviewDisplay, voteOnReview } from "@/services/reviewsService";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";

interface ReviewWidgetProps {
    review: ReviewDisplay;
    onVoted?: () => Promise<void> | void;
}

function fmtDate(iso: string) {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

type VoteResultMaybe = { voteScore: number; myVote: -1 | 0 | 1 } | { vote_score: number; my_vote: -1 | 0 | 1 };

type CommentWithVotes = ReviewCommentPublic & {
    voteScore?: number;
    myVote?: -1 | 0 | 1;
};

type ThreadNode = CommentWithVotes & { replies: ThreadNode[] };

function buildThread(rows: CommentWithVotes[]): ThreadNode[] {
    const map = new Map<number, ThreadNode>();
    const roots: ThreadNode[] = [];

    for (const c of rows) map.set(c.id, { ...c, replies: [] });

    for (const node of map.values()) {
        if (node.parent_comment_id && map.has(node.parent_comment_id)) {
            map.get(node.parent_comment_id)!.replies.push(node);
        } else {
            roots.push(node);
        }
    }

    const sortRec = (nodes: ThreadNode[]) => {
        nodes.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        nodes.forEach((n) => sortRec(n.replies));
    };
    sortRec(roots);

    return roots;
}

const ReviewWidget = ({ review, onVoted }: ReviewWidgetProps) => {
    const reviewIdForVotes = review.reviewId;
    const reviewIdForComments = typeof reviewIdForVotes === "number" ? reviewIdForVotes : Number(reviewIdForVotes);
    const hasNumericReviewId = Number.isFinite(reviewIdForComments);

    // reporting reviews state
    const [showReportBox, setShowReportBox] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reporting, setReporting] = useState(false);

    const [voteScore, setVoteScore] = useState(review.voteScore);
    const [myVote, setMyVote] = useState<-1 | 0 | 1>((review.myVote ?? 0) as -1 | 0 | 1);
    const [busy, setBusy] = useState(false);

    // comments
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<CommentWithVotes[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);

    // comment box
    const [comment, setComment] = useState("");
    const [posting, setPosting] = useState(false);
    const [commentErr, setCommentErr] = useState<string>("");

    // reply state
    const [replyToId, setReplyToId] = useState<number | null>(null);
    const [replyText, setReplyText] = useState("");

    // comment voting
    const [commentVotingId, setCommentVotingId] = useState<number | null>(null);

    // keep local review vote state in sync when parent refreshes
    useEffect(() => {
        setVoteScore(review.voteScore);
        setMyVote((review.myVote ?? 0) as -1 | 0 | 1);
    }, [review.voteScore, review.myVote, review]);

    const threadedComments = useMemo(() => buildThread(comments), [comments]);

    const handleVote = async (direction: 1 | -1) => {
        if (busy) return;
        setBusy(true);

        try {
            const res = await voteOnReview(reviewIdForVotes, direction);

            if ((res as any)?.deleted) {
                await onVoted?.();
                return;
            }

            if (res) {
                if (typeof (res as any).vote_score === "number") {
                    setVoteScore((res as any).vote_score);
                    setMyVote(((res as any).my_vote ?? 0) as -1 | 0 | 1);
                } else if (typeof (res as any).upvotes === "number" && typeof (res as any).downvotes === "number") {
                    setVoteScore((res as any).upvotes - (res as any).downvotes);
                } else if (typeof (res as any).voteScore === "number") {
                    setVoteScore((res as any).voteScore);
                    setMyVote(((res as any).myVote ?? 0) as -1 | 0 | 1);
                }
            }
        } catch (e) {
            console.log("Vote error:", e);
        } finally {
            setBusy(false);
        }
    };

    const handleReport = async () => {
        if (!hasNumericReviewId) {
            Alert.alert("Error", "This review cannot be reported.");
            return;
        }
        const trimmedReason = reportReason.trim();

        if (!trimmedReason) {
            Alert.alert("Missing Reason", "Please provide a reason for the report.");
            return;
        }
        if (reporting) return;
        setReporting(true);
        try {
            await reportReview(reviewIdForComments, trimmedReason);
            setReportReason("");
            setShowReportBox(false);
            Alert.alert("Successful Report!");
        } catch (e) {
            console.log("Report Error:", e);
            Alert.alert("Error", "Review cannot be reported");
        } finally {
            setReporting(false);
        }
    };

    const loadComments = async () => {
        if (!hasNumericReviewId) {
            setCommentErr("Comments unavailable for this review.");
            return;
        }

        setCommentsLoading(true);
        setCommentErr("");
        try {
            const rows = await getReviewComments(reviewIdForComments);
            setComments(rows as CommentWithVotes[]);
        } catch (e: any) {
            setCommentErr(e?.message ?? "Failed to load comments");
        } finally {
            setCommentsLoading(false);
        }
    };

    const toggleComments = async () => {
        const next = !showComments;
        setShowComments(next);
        setCommentErr("");

        if (next) {
            await loadComments();
        } else {
            setReplyToId(null);
            setReplyText("");
        }
    };

    const submitTopLevelComment = async () => {
        if (!hasNumericReviewId) {
            setCommentErr("Comments unavailable for this review.");
            return;
        }

        const trimmed = comment.trim();
        if (!trimmed || posting) return;

        setPosting(true);
        setCommentErr("");

        try {
            const created = await addReviewComment(reviewIdForComments, trimmed, null);
            setComments((prev) => [...prev, created as CommentWithVotes]);
            setComment("");
        } catch (e: any) {
            setCommentErr(e?.message ?? "Failed to post comment");
        } finally {
            setPosting(false);
        }
    };

    const submitReply = async (parentId: number) => {
        if (!hasNumericReviewId) {
            setCommentErr("Comments unavailable for this review.");
            return;
        }

        const trimmed = replyText.trim();
        if (!trimmed || posting) return;

        setPosting(true);
        setCommentErr("");

        try {
            const created = await addReviewComment(reviewIdForComments, trimmed, parentId);
            setComments((prev) => [...prev, created as CommentWithVotes]);
            setReplyText("");
            setReplyToId(null);
        } catch (e: any) {
            setCommentErr(e?.message ?? "Failed to post reply");
        } finally {
            setPosting(false);
        }
    };

    const normalizeVoteResult = (res: VoteResultMaybe) => {
        if ("voteScore" in res) return res;
        return { voteScore: res.vote_score, myVote: res.my_vote };
    };

    const handleCommentVote = async (commentId: number, direction: 1 | -1) => {
        if (commentVotingId) return;

        const target = comments.find((c) => c.id === commentId);
        const prevMyVote = (target?.myVote ?? 0) as -1 | 0 | 1;
        const prevScore = target?.voteScore ?? 0;

        const nextMyVote: -1 | 0 | 1 = prevMyVote === direction ? 0 : direction;
        const nextScore = prevScore + (nextMyVote - prevMyVote);

        setComments((cs) =>
            cs.map((c) => (c.id === commentId ? { ...c, myVote: nextMyVote, voteScore: nextScore } : c)),
        );

        setCommentVotingId(commentId);
        try {
            const raw = (await voteOnReviewComment(commentId, direction)) as VoteResultMaybe;

            const res = normalizeVoteResult(raw);

            setComments((cs) =>
                cs.map((c) => (c.id === commentId ? { ...c, myVote: res.myVote, voteScore: res.voteScore } : c)),
            );
        } catch (e) {
            setComments((cs) =>
                cs.map((c) => (c.id === commentId ? { ...c, myVote: prevMyVote, voteScore: prevScore } : c)),
            );
        } finally {
            setCommentVotingId(null);
        }
    };

    const renderNode = (node: ThreadNode, depth = 0) => {
        const clampedDepth = Math.min(depth, 3);
        const indentClass =
            clampedDepth === 0 ? "ml-0" : clampedDepth === 1 ? "ml-6" : clampedDepth === 2 ? "ml-10" : "ml-14";

        const nodeScore = node.voteScore ?? 0;
        const nodeMyVote = (node.myVote ?? 0) as -1 | 0 | 1;

        const upColor = nodeMyVote === 1 ? colors.success : colors.text;
        const downColor = nodeMyVote === -1 ? colors.error : colors.text;

        return (
            <View key={node.id} className={`${indentClass} gap-2`}>
                <View className="bg-colors-background rounded-md p-2 border border-colors-textSecondary">
                    <View className="flex-row justify-between items-center">
                        <Text className="color-colors-textSecondary text-sm">{fmtDate(node.created_at)}</Text>

                        <View className="flex-row items-center gap-2">
                            <TouchableOpacity
                                testID={`comment-${node.id}-vote-up`}
                                onPress={() => handleCommentVote(node.id, 1)}
                                disabled={commentVotingId === node.id}
                            >
                                <Ionicons name="arrow-up-circle" size={22} color={upColor} />
                            </TouchableOpacity>

                            <Text className="color-colors-text text-sm">{nodeScore}</Text>

                            <TouchableOpacity
                                testID={`comment-${node.id}-vote-down`}
                                onPress={() => handleCommentVote(node.id, -1)}
                                disabled={commentVotingId === node.id}
                            >
                                <Ionicons name="arrow-down-circle" size={22} color={downColor} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text className="color-colors-text text-base mt-1">{node.content}</Text>

                    <TouchableOpacity
                        onPress={() => {
                            setCommentErr("");
                            setReplyToId(node.id);
                            setReplyText("");
                        }}
                        className="flex-row items-center gap-2 mt-2"
                    >
                        <Ionicons name="return-down-back-outline" size={18} color={colors.text} />
                        <Text className="color-colors-text">Reply</Text>
                    </TouchableOpacity>
                </View>

                {replyToId === node.id && (
                    <View className="gap-2">
                        <TextInput
                            value={replyText}
                            onChangeText={setReplyText}
                            placeholder="Write an anonymous reply..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            className="bg-colors-background rounded-md p-2 border border-colors-textSecondary color-colors-text"
                        />

                        <View className="flex-row justify-end gap-3">
                            <TouchableOpacity
                                onPress={() => {
                                    setReplyToId(null);
                                    setReplyText("");
                                }}
                                className="px-3 py-2 rounded-md border border-colors-textSecondary"
                            >
                                <Text className="color-colors-text">Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => submitReply(node.id)}
                                disabled={posting || !replyText.trim()}
                                className="bg-colors-primary px-4 py-2 rounded-md"
                            >
                                {posting ? (
                                    <ActivityIndicator />
                                ) : (
                                    <Text className="color-colors-text font-semibold">Reply</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {node.replies?.length ? (
                    <View className="gap-2">{node.replies.map((r) => renderNode(r, depth + 1))}</View>
                ) : null}
            </View>
        );
    };

    const upColor = myVote === 1 ? colors.success : colors.text;
    const downColor = myVote === -1 ? colors.error : colors.text;
    return (
        <View className="bg-colors-secondary w-[90vw] rounded-lg border border-colors-text p-2 gap-4 shadow-md">
            <View className="flex-row justify-between">
                <View>
                    <Text className="color-colors-text text-2xl font-semibold">{review.code}</Text>
                    <Text className="color-colors-textSecondary text-lg">{parseLastName(review.profName)}</Text>
                </View>
                <View>
                    <Text className="color-colors-text text-2xl font-semibold">{review.term}</Text>
                    <Text className="color-colors-textSecondary text-lg text-right">{review.reviewDate}</Text>
                </View>
            </View>

            <Text className="color-colors-text text-center text-lg">{review.reviewText}</Text>

            <View className="flex flex-row justify-between">
                <View className="flex items-center">
                    <Text className="color-colors-textSecondary text-lg">Difficulty</Text>
                    <Text className="color-colors-text text-2xl font-semibold">{review.courseDiff}/10</Text>
                </View>
                <View className="flex items-center">
                    <Text className="color-colors-textSecondary text-lg">Quality</Text>
                    <Text className="color-colors-text text-2xl font-semibold">{review.profRating}/10</Text>
                </View>
                <View className="flex items-center">
                    <Text className="color-colors-textSecondary text-lg">Grade</Text>
                    <Text className="color-colors-text text-2xl font-semibold">{review.grade}</Text>
                </View>
            </View>

            <View className="flex flex-row justify-between items-center border-t border-colors-textSecondary pt-2">
                <View className="flex flex-row gap-4">
                    <TouchableOpacity onPress={toggleComments} className="flex-row items-center gap-2">
                        <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowReportBox(true)} className="flex-row items-center gap-2">
                        <Ionicons name="flag-outline" size={22} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <View className="flex-row items-center gap-3">
                    <TouchableOpacity testID="vote-up" onPress={() => handleVote(1)} disabled={busy}>
                        <Ionicons name="arrow-up-circle" size={28} color={upColor} />
                    </TouchableOpacity>

                    <Text className="color-colors-text text-lg">{voteScore}</Text>

                    <TouchableOpacity testID="vote-down" onPress={() => handleVote(-1)} disabled={busy}>
                        <Ionicons name="arrow-down-circle" size={28} color={downColor} />
                    </TouchableOpacity>
                </View>
            </View>
            {showComments && (
                <View className="gap-2">
                    {commentErr ? <Text className="color-colors-textSecondary">{commentErr}</Text> : null}

                    <TextInput
                        value={comment}
                        onChangeText={(t) => setComment(t)}
                        placeholder="Comment"
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        className="bg-colors-background rounded-md p-2 border border-colors-textSecondary color-colors-text"
                    />

                    <View className="flex-row justify-between items-center">
                        <TouchableOpacity
                            onPress={loadComments}
                            disabled={commentsLoading}
                            className="flex-row items-center gap-2"
                        >
                            <Ionicons name="refresh" size={18} color={colors.text} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={submitTopLevelComment}
                            disabled={posting || !comment.trim()}
                            className="bg-colors-primary px-4 py-2 rounded-md"
                        >
                            {posting ? (
                                <ActivityIndicator />
                            ) : (
                                <Text className="color-colors-text font-semibold">Post</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {commentsLoading ? (
                        <ActivityIndicator />
                    ) : comments.length === 0 ? (
                        <Text className="color-colors-textSecondary">No comments yet.</Text>
                    ) : (
                        <View className="gap-2 mt-1">{threadedComments.map((c) => renderNode(c, 0))}</View>
                    )}
                </View>
            )}
            <Modal
                visible={showReportBox}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    setShowReportBox(false);
                    setReportReason("");
                }}
            >
                <View className="flex-1 justify-center items-center bg-black/50 px-6">
                    <View className="w-full rounded-2xl bg-colors-secondary p-4 border border-colors-text">
                        <Text className="color-colors-text text-xl font-semibold mb-2">Report Review</Text>
                        <Text className="color-colors-textSecondary mb-3">Why are you reporting?</Text>
                        <TextInput
                            value={reportReason}
                            onChangeText={setReportReason}
                            placeholder="Write your reason here..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            className="bg-colors-background rounded-md p-3 border border-colors-textSecondary color-colors-text min-h-[100px]"
                        />
                        <View className="flex-row justify-end gap-3 mt-4">
                            <TouchableOpacity
                                onPress={() => {
                                    setShowReportBox(false);
                                    setReportReason("");
                                }}
                                className="px-4 py-2 rounded-md border border-colors-textSecondary"
                            >
                                <Text className="color-colors-text">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleReport}
                                disabled={reporting || !reportReason.trim()}
                                className="bg-red-500 px-4 py-2 rounded-md"
                            >
                                {reporting ? (
                                    <ActivityIndicator />
                                ) : (
                                    <Text className="text-white font-semibold">Submit Report</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default ReviewWidget;
