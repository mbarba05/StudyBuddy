import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/assets/colors";
import { parseLastName } from "@/lib/utillities";
import { ReviewDisplay } from "@/services/reviewsService";
import {
  addReviewComment,
  getReviewCommentCount,
  getReviewCommentsWithAuthors,
  ReviewCommentWithAuthor,
} from "@/services/reviewCommentService";

interface ReviewWidgetProps {
  review: ReviewDisplay;
}

const ReviewWidget = ({ review }: ReviewWidgetProps) => {
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentCount, setCommentCount] = useState(0);
  const [isPosting, setIsPosting] = useState(false);

  const [comments, setComments] = useState<ReviewCommentWithAuthor[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const c = await getReviewCommentCount(review.reviewId);
        setCommentCount(c);
      } catch {
        
      }
    })();
  }, [review.reviewId]);

  const loadComments = async () => {
    try {
      setIsLoadingComments(true);
      const data = await getReviewCommentsWithAuthors(review.reviewId);
      setComments(data);
    } catch (e: any) {
      Alert.alert("Couldn't load comments", e?.message ?? "Try again.");
    } finally {
      setIsLoadingComments(false);
    }
  };

  const openModal = async () => {
    setIsCommentModalOpen(true);
    await loadComments();
  };

  const closeModal = () => {
    setIsCommentModalOpen(false);
    setCommentText("");
  };

  const postComment = async () => {
    const content = commentText.trim();
    if (!content) return;

    try {
      setIsPosting(true);
      await addReviewComment(review.reviewId, content);

    // Refresh comments
      setCommentText("");
      setCommentCount((c) => c + 1);
      await loadComments();
    } catch (e: any) {
      Alert.alert("Couldn't post comment", e?.message ?? "Try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const renderComment = ({ item }: { item: ReviewCommentWithAuthor }) => {
    const name = item.author?.display_name ?? "User";
    const ppUrl = item.author?.pp_url ?? null;

    return (
      <View className="py-2 border-b border-colors-textSecondary">
        <View className="flex-row items-center gap-2 mb-1">
          {ppUrl ? (
            <Image
              source={{ uri: ppUrl }}
              style={{ width: 28, height: 28, borderRadius: 14 }}
            />
          ) : (
            <View
              style={{ width: 28, height: 28, borderRadius: 14 }}
              className="bg-colors-textSecondary items-center justify-center"
            >
              <Text className="color-colors-secondary text-xs font-semibold">
                {name?.trim()?.[0]?.toUpperCase() ?? "U"}
              </Text>
            </View>
          )}

          <Text className="color-colors-text font-semibold">{name}</Text>
        </View>

        <Text className="color-colors-text">{item.content}</Text>
        <Text className="color-colors-textSecondary text-xs mt-1">
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <View className="bg-colors-secondary w-[90vw] rounded-lg border border-colors-text p-2 gap-4 shadow-md">
      <View className="flex-row justify-between">
        <View>
          <Text className="color-colors-text text-2xl font-semibold">{review.code}</Text>
          <Text className="color-colors-textSecondary text-lg">
            {parseLastName(review.profName)}
          </Text>
        </View>

        <View>
          <Text className="color-colors-text text-2xl font-semibold">{review.term}</Text>
          <Text className="color-colors-textSecondary text-lg text-right">
            {parseLastName(review.reviewDate)}
          </Text>
        </View>
      </View>

      <View>
        <Text className="color-colors-text text-center text-lg">{review.reviewText}</Text>
      </View>

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
          <Text className="color-colors-text text-2xl font-semibold">{review.grade}</Text>
        </View>
      </View>

      <View className="flex flex-row justify-between border-colors-textSecondary border-t pt-2">
        <View className="flex-row gap-4 items-center">
        
          <TouchableOpacity className="flex-row gap-1 items-center" onPress={openModal}>
            <Ionicons name="chatbox-outline" color={colors.text} size={24} />
            <Text className="color-colors-text text-lg">{commentCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Ionicons name="paper-plane-outline" color={colors.text} size={24} />
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-2 items-center">
          <TouchableOpacity>
            <Ionicons name="arrow-up-circle" color={colors.text} size={28} />
          </TouchableOpacity>
          <Text className="color-colors-text text-lg">1</Text>
          <TouchableOpacity>
            <Ionicons name="arrow-down-circle" color={colors.text} size={28} />
          </TouchableOpacity>
        </View>
      </View>

      
      <Modal
        visible={isCommentModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-4">
          <View className="bg-colors-secondary border border-colors-text rounded-xl p-4 w-full gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="color-colors-text text-xl font-semibold">Comments</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            
            <View
              className="border border-colors-textSecondary rounded-lg p-2"
              style={{ maxHeight: 240 }}
            >
              {isLoadingComments ? (
                <Text className="color-colors-textSecondary">Loading...</Text>
              ) : comments.length === 0 ? (
                <Text className="color-colors-textSecondary">No comments yet. Be the first.</Text>
              ) : (
                <FlatList
                  data={comments}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={renderComment}
                />
              )}
            </View>

            
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write your comment..."
              placeholderTextColor={colors.textSecondary}
              multiline
              className="border border-colors-textSecondary rounded-lg p-3 color-colors-text"
              style={{ minHeight: 70, textAlignVertical: "top" }}
            />

            <View className="flex-row justify-end gap-4">
              <TouchableOpacity onPress={loadComments} disabled={isLoadingComments}>
                <Text className="color-colors-textSecondary text-lg">
                  {isLoadingComments ? "Refreshing..." : "Refresh"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={postComment}
                disabled={isPosting || commentText.trim().length === 0}
              >
                <Text className="color-colors-text text-lg">
                  {isPosting ? "Posting..." : "Post"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ReviewWidget;
