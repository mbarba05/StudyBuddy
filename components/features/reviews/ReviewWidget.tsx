import { colors } from "@/assets/colors";
import { parseLastName } from "@/lib/utillities";
import { ReviewDisplay, voteOnReview } from "@/services/reviewsService";
import {
  addReviewComment,
  getReviewComments,
  ReviewCommentPublic,
} from "@/services/reviewCommentsService";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";

interface ReviewWidgetProps {
  review: ReviewDisplay;
  onVoted?: () => Promise<void> | void;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

type ThreadNode = ReviewCommentPublic & { replies: ThreadNode[] };

function buildThread(rows: ReviewCommentPublic[]): ThreadNode[] {
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

  // Optional: keep replies chronologically sorted
  const sortRec = (nodes: ThreadNode[]) => {
    nodes.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    nodes.forEach((n) => sortRec(n.replies));
  };
  sortRec(roots);

  return roots;
}

const ReviewWidget = ({ review, onVoted }: ReviewWidgetProps) => {
  // Your review object sometimes uses reviewId or id; handle either
  const reviewId = (review as any).reviewId ?? (review as any).id;

  const [upvotes, setUpvotes] = useState((review as any).upvotes ?? 0);
  const [downvotes, setDownvotes] = useState((review as any).downvotes ?? 0);
  const [busy, setBusy] = useState(false);

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<ReviewCommentPublic[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // New comment box (top-level)
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentErr, setCommentErr] = useState<string>("");

  // Reply state
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    setUpvotes((review as any).upvotes ?? 0);
    setDownvotes((review as any).downvotes ?? 0);
  }, [review]);

  const threadedComments = useMemo(() => buildThread(comments), [comments]);

  const handleVote = async (direction: 1 | -1) => {
    if (busy) return;
    setBusy(true);

    try {
      const res = await voteOnReview(reviewId, direction);

      if (res?.deleted) {
        await onVoted?.();
        return;
      }

      if (res) {
        setUpvotes(res.upvotes);
        setDownvotes(res.downvotes);
      }
    } catch (e) {
      console.log("Vote error:", e);
    } finally {
      setBusy(false);
    }
  };

  const loadComments = async () => {
    setCommentsLoading(true);
    setCommentErr("");
    try {
      const rows = await getReviewComments(reviewId);
      setComments(rows);
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
      // Opening: fetch comments
      await loadComments();
    } else {
      // Closing: reset reply UI
      setReplyToId(null);
      setReplyText("");
    }
  };

  const submitTopLevelComment = async () => {
    const trimmed = comment.trim();
    if (!trimmed || posting) return;

    setPosting(true);
    setCommentErr("");

    try {
      const created = await addReviewComment(reviewId, trimmed, null);
      setComments((prev) => [...prev, created]);
      setComment("");
    } catch (e: any) {
      setCommentErr(e?.message ?? "Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  const submitReply = async (parentId: number) => {
    const trimmed = replyText.trim();
    if (!trimmed || posting) return;

    setPosting(true);
    setCommentErr("");

    try {
      const created = await addReviewComment(reviewId, trimmed, parentId);
      setComments((prev) => [...prev, created]);
      setReplyText("");
      setReplyToId(null);
    } catch (e: any) {
      setCommentErr(e?.message ?? "Failed to post reply");
    } finally {
      setPosting(false);
    }
  };

  const renderNode = (node: ThreadNode, depth = 0) => {
    // Prevent insane indentation; feel free to increase this
    const clampedDepth = Math.min(depth, 3);
    const indentClass =
      clampedDepth === 0 ? "ml-0" : clampedDepth === 1 ? "ml-6" : clampedDepth === 2 ? "ml-10" : "ml-14";

    return (
      <View key={node.id} className={`${indentClass} gap-2`}>
        <View className="bg-colors-background rounded-md p-2 border border-colors-textSecondary">
          <Text className="color-colors-textSecondary text-sm">
            Anonymous • {fmtDate(node.created_at)}
          </Text>

          <Text className="color-colors-text text-base">{node.content}</Text>

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

        {/* Inline reply box */}
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

        {/* Render replies */}
        {node.replies?.length ? (
          <View className="gap-2">
            {node.replies.map((r) => renderNode(r, depth + 1))}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View className="bg-colors-secondary w-[90vw] rounded-lg border border-colors-text p-2 gap-4 shadow-md">
      <View className="flex-row justify-between">
        <View>
          <Text className="color-colors-text text-2xl font-semibold">{(review as any).code}</Text>
          <Text className="color-colors-textSecondary text-lg">
            {parseLastName((review as any).profName)}
          </Text>
        </View>
        <View>
          <Text className="color-colors-text text-2xl font-semibold">{(review as any).term}</Text>
          <Text className="color-colors-textSecondary text-lg text-right">
            {(review as any).reviewDate}
          </Text>
        </View>
      </View>

      <Text className="color-colors-text text-center text-lg">{(review as any).reviewText}</Text>

      <View className="flex flex-row justify-between">
        <View className="flex items-center">
          <Text className="color-colors-textSecondary text-lg">Difficulty</Text>
          <Text className="color-colors-text text-2xl font-semibold">
            {(review as any).courseDiff}/10
          </Text>
        </View>
        <View className="flex items-center">
          <Text className="color-colors-textSecondary text-lg">Quality</Text>
          <Text className="color-colors-text text-2xl font-semibold">
            {(review as any).profRating}/10
          </Text>
        </View>
        <View className="flex items-center">
          <Text className="color-colors-textSecondary text-lg">Grade</Text>
          <Text className="color-colors-text text-2xl font-semibold">{(review as any).grade}</Text>
        </View>
      </View>

      {/* Bottom row: Comment button (left) + Votes (right) */}
      <View className="flex flex-row justify-between items-center border-t border-colors-textSecondary pt-2">
        <TouchableOpacity onPress={toggleComments} className="flex-row items-center gap-2">
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.text} />
          <Text className="color-colors-text text-lg">
            Comment{comments.length ? ` (${comments.length})` : ""}
          </Text>
        </TouchableOpacity>

        <View className="flex flex-row items-center gap-3">
          <TouchableOpacity onPress={() => handleVote(1)} disabled={busy}>
            <Ionicons name="arrow-up-circle" size={28} color={colors.text} />
          </TouchableOpacity>

          <Text className="color-colors-text text-lg">{upvotes}</Text>

          <TouchableOpacity onPress={() => handleVote(-1)} disabled={busy}>
            <Ionicons name="arrow-down-circle" size={28} color={colors.text} />
          </TouchableOpacity>

          <Text className="color-colors-text text-lg">{downvotes}</Text>
        </View>
      </View>

      {/* Comments section */}
      {showComments && (
        <View className="gap-2">
          {commentErr ? <Text className="color-colors-textSecondary">{commentErr}</Text> : null}

          {/* Top-level comment input */}
          <TextInput
            value={comment}
            onChangeText={(t) => setComment(t)}
            placeholder="Leave an anonymous comment..."
            placeholderTextColor={colors.textSecondary}
            multiline
            className="bg-colors-background rounded-md p-2 border border-colors-textSecondary color-colors-text"
          />

          <View className="flex-row justify-between items-center">
            <TouchableOpacity onPress={loadComments} disabled={commentsLoading} className="flex-row items-center gap-2">
              <Ionicons name="refresh" size={18} color={colors.text} />
              <Text className="color-colors-text">Refresh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={submitTopLevelComment}
              disabled={posting || !comment.trim()}
              className="bg-colors-primary px-4 py-2 rounded-md"
            >
              {posting ? <ActivityIndicator /> : <Text className="color-colors-text font-semibold">Post</Text>}
            </TouchableOpacity>
          </View>

          {/* Threaded list */}
          {commentsLoading ? (
            <ActivityIndicator />
          ) : comments.length === 0 ? (
            <Text className="color-colors-textSecondary">No comments yet.</Text>
          ) : (
            <View className="gap-2 mt-1">
              {threadedComments.map((c) => renderNode(c, 0))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default ReviewWidget;
