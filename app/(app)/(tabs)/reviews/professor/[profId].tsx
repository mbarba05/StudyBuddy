import ReviewWidget from "@/components/features/reviews/ReviewWidget";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { ReviewSeparator } from "@/components/ui/Seperators";
import { getReviewsForProf, ReviewDisplay } from "@/services/reviewsService";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import supabase from "@/lib/subapase";
import { useFocusEffect } from "@react-navigation/native";

const ProfessorReviewsScreen = () => {
  const { profId, profName } = useLocalSearchParams<{
    profId: string;
    profName?: string;
  }>();

  const [reviews, setReviews] = useState<ReviewDisplay[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
  const init = async () => {
    const { data } = await supabase.auth.getSession();
    setUserId(data.session?.user?.id ?? null);
  };

  init();

  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    setUserId(session?.user?.id ?? null);
  });

  return () => {
    sub.subscription.unsubscribe();
  };
}, []);



  const fetchReviews = useCallback(async () => {
  if (!profId) return;

  setLoading(true);

  const data = await getReviewsForProf(Number(profId));

  // Always set something so UI isn't stuck / inconsistent
  if (!data || data.length === 0) {
    setReviews([]);
    setLoading(false);
    return;
  }

  // If not logged in, no personal vote colors
  if (!userId) {
    setReviews(data.map(r => ({ ...r, myVote: 0 })));
    setLoading(false);
    return;
  }

  // Logged in: fetch this user's votes
  const reviewIds = data.map(r => r.reviewId);

  const { data: voteRows, error } = await supabase
    .from("review_votes")
    .select("review_id, vote")
    .in("review_id", reviewIds)
    .eq("user_id", userId);

  if (error) {
    console.log("Error fetching my votes:", error);
    setReviews(data.map(r => ({ ...r, myVote: 0 })));
    setLoading(false);
    return;
  }

  const myVoteMap = new Map<number, -1 | 1>();
  for (const row of voteRows ?? []) {
    myVoteMap.set(row.review_id, row.vote as -1 | 1);
  }

  const merged = data.map(r => ({
    ...r,
    myVote: (myVoteMap.get(r.reviewId) ?? 0) as -1 | 0 | 1,
  }));

  setReviews(merged);
  setLoading(false);
}, [profId, userId]);


useEffect(() => {
  if (!profId) return;
  if (userId === undefined) return;
  fetchReviews();
}, [profId, userId]);


 useFocusEffect(
  useCallback(() => {
    if (!profId) return;
    if (userId === undefined) return; // wait until auth restored
    fetchReviews();
  }, [fetchReviews, profId, userId])
);

  
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
