import ReviewWidget from "@/components/features/reviews/ReviewWidget";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { ReviewSeparator } from "@/components/ui/Seperators";
import { getReviewsForProf, ReviewDisplay } from "@/services/reviewsService";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ProfessorReviewsScreen = () => {
  const { profId, profName } = useLocalSearchParams<{
    profId: string;
    profName?: string;
  }>();

  const [reviews, setReviews] = useState<ReviewDisplay[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    if (!profId) return;
    setLoading(true);
    const data = await getReviewsForProf(Number(profId));
    setReviews(data);
    setLoading(false);
  }, [profId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-colors-background items-center p-4">
      <Text className="color-colors-text font-semibold text-4xl mb-4 text-center">
        Reviews for {profName}
      </Text>

      {reviews && reviews.length > 0 ? (
        <FlatList
          data={reviews}
          keyExtractor={(r) => String(r.reviewId)}
          renderItem={({ item }) => (
            <ReviewWidget review={item} onVoted={fetchReviews} />
          )}
          ItemSeparatorComponent={ReviewSeparator}
        />
      ) : (
        <Text className="text-colors-textSecondary text-lg text-center mt-4">
          No reviews yet for this professor.
        </Text>
      )}
    </SafeAreaView>
  );
};

export default ProfessorReviewsScreen;
