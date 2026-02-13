import { colors } from "@/assets/colors";
import { parseLastName } from "@/lib/utillities";
import { ReviewDisplay, voteOnReview } from "@/services/reviewsService";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ReviewWidgetProps {
  review: ReviewDisplay;
  onVoted?: () => Promise<void> | void;
}

const ReviewWidget = ({ review, onVoted }: ReviewWidgetProps) => {
  const [voteScore, setVoteScore] = useState(review.voteScore);
  const [myVote, setMyVote] = useState<-1 | 0 | 1>(review.myVote ?? 0);
  const [busy, setBusy] = useState(false);

  // Keep local state in sync when parent refreshes
  useEffect(() => {
    setVoteScore(review.voteScore);
    setMyVote((review.myVote ?? 0) as -1 | 0 | 1);
  }, [review.voteScore, review.myVote]);

  const handleVote = async (direction: 1 | -1) => {
    if (busy) return;
    setBusy(true);

    try {
      const res = await voteOnReview(review.reviewId, direction);

      if (res?.deleted) {
        // review hit 5 downvotes and was removed
        await onVoted?.();
        return;
      }

      if (res) {
        //RPC returns vote_score + my_vote
        setVoteScore(res.vote_score);
        setMyVote((res.my_vote ?? 0) as -1 | 0 | 1);
      }
    } catch (e) {
      console.log("Vote error:", e);
    } finally {
      setBusy(false);
    }
  };

  const upColor = myVote === 1 ? colors.success : colors.text;
  const downColor = myVote === -1 ? colors.error : colors.text;

  return (
    <View className="bg-colors-secondary w-[90vw] rounded-lg border border-colors-text p-2 gap-4 shadow-md">
      <View className="flex-row justify-between">
        <View>
          <Text className="color-colors-text text-2xl font-semibold">
            {review.code}
          </Text>
          <Text className="color-colors-textSecondary text-lg">
            {parseLastName(review.profName)}
          </Text>
        </View>
        <View>
          <Text className="color-colors-text text-2xl font-semibold">
            {review.term}
          </Text>
          <Text className="color-colors-textSecondary text-lg text-right">
            {review.reviewDate}
          </Text>
        </View>
      </View>

      <Text className="color-colors-text text-center text-lg">
        {review.reviewText}
      </Text>

      <View className="flex flex-row justify-between">
        <View className="flex items-center">
          <Text className="color-colors-textSecondary text-lg">Difficulty</Text>
          <Text className="color-colors-text text-2xl font-semibold">
            {review.courseDiff}/10
          </Text>
        </View>
        <View className="flex items-center">
          <Text className="color-colors-textSecondary text-lg">Quality</Text>
          <Text className="color-colors-text text-2xl font-semibold">
            {review.profRating}/10
          </Text>
        </View>
        <View className="flex items-center">
          <Text className="color-colors-textSecondary text-lg">Grade</Text>
          <Text className="color-colors-text text-2xl font-semibold">
            {review.grade}
          </Text>
        </View>
      </View>

      <View className="flex flex-row justify-end gap-3 border-t border-colors-textSecondary pt-2">
        <TouchableOpacity
          onPress={() => handleVote(1)}
          disabled={busy}
        >
          <Ionicons name="arrow-up-circle" size={28} color={myVote === 1 ? colors.success : colors.text} />
        </TouchableOpacity>

        <Text className="color-colors-text text-lg">{voteScore}</Text>

        <TouchableOpacity
          onPress={() => handleVote(-1)}
          disabled={busy}
        >
          <Ionicons name="arrow-down-circle" size={28} color={myVote === -1 ? colors.error : colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ReviewWidget;
