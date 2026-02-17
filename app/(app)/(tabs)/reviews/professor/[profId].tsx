import { colors } from "@/assets/colors";
import ReviewWidget from "@/components/features/reviews/ReviewWidget";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { ReviewSeparator } from "@/components/ui/Seperators";
import { getReviewsForProf, ReviewDisplay } from "@/services/reviewsService";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, ScrollView, Text, TouchableOpacity } from "react-native";
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

  // Auth state for “myVote” hydration
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  // Course filter state
  const [selectedCourseCode, setSelectedCourseCode] = useState<string | null>(null);

  // 1) Hydrate auth session + listen for changes
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

  // 2) Fetch reviews + merge in “myVote”
  const fetchReviews = useCallback(async () => {
    if (!profId) return;

    setLoading(true);

    const data = await getReviewsForProf(Number(profId));

    // Always set something so UI doesn't get stuck
    if (!data || data.length === 0) {
      setReviews([]);
      setLoading(false);
      return;
    }

    // If not logged in: no personal vote colors
    if (!userId) {
      setReviews(data.map((r) => ({ ...r, myVote: 0 })));
      setLoading(false);
      return;
    }

    // Logged in: fetch this user's votes for these reviews
    const reviewIds = data.map((r) => r.reviewId);

    const { data: voteRows, error } = await supabase
      .from("review_votes")
      .select("review_id, vote")
      .in("review_id", reviewIds)
      .eq("user_id", userId);

    if (error) {
      console.log("Error fetching my votes:", error);
      setReviews(data.map((r) => ({ ...r, myVote: 0 })));
      setLoading(false);
      return;
    }

    const myVoteMap = new Map<number, -1 | 1>();
    for (const row of voteRows ?? []) {
      myVoteMap.set(row.review_id, row.vote as -1 | 1);
    }

    const merged = data.map((r) => ({
      ...r,
      myVote: (myVoteMap.get(r.reviewId) ?? 0) as -1 | 0 | 1,
    }));

    setReviews(merged);
    setLoading(false);
  }, [profId, userId]);

  // 3) Fetch when profId becomes available AND auth is restored
  useEffect(() => {
    if (!profId) return;
    if (userId === undefined) return; // wait until auth restored
    fetchReviews();
  }, [profId, userId, fetchReviews]);

  // 4) Refetch on screen focus (keeps vote state in sync when navigating back)
  useFocusEffect(
    useCallback(() => {
      if (!profId) return;
      if (userId === undefined) return;
      fetchReviews();
    }, [fetchReviews, profId, userId])
  );

  // 5) Build course options from current reviews (so it matches filtered+vote-merged data)
  const courseOptions = useMemo(() => {
    const list = reviews ?? [];
    const unique = Array.from(new Set(list.map((r) => r.code).filter(Boolean)));
    return unique.map((code, i) => ({ id: i, code }));
  }, [reviews]);

  // 6) Apply course filter
  const filteredReviews = useMemo(() => {
    if (!reviews) return reviews;
    if (!selectedCourseCode) return reviews;
    return reviews.filter((r) => r.code === selectedCourseCode);
  }, [reviews, selectedCourseCode]);

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-colors-background p-4" edges={["top", "left", "right"]}>
      <Text className="color-colors-text font-semibold text-4xl mb-4 text-center">
        Reviews for {profName}
      </Text>

      {/* Course filter */}
      {courseOptions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ marginBottom: 12 }}
        >
          <TouchableOpacity
            onPress={() => setSelectedCourseCode(null)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              marginRight: 8,
              height: 32,
              backgroundColor: selectedCourseCode === null ? colors.secondary : colors.primary,
            }}
          >
            <Text
              style={{
                color: selectedCourseCode === null ? "#fff" : colors.text,
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              All
            </Text>
          </TouchableOpacity>

          {courseOptions.map((course) => (
            <TouchableOpacity
              key={course.id}
              onPress={() =>
                setSelectedCourseCode(selectedCourseCode === course.code ? null : course.code)
              }
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                marginRight: 8,
                height: 32,
                backgroundColor:
                  selectedCourseCode === course.code ? colors.secondary : colors.primary,
              }}
            >
              <Text
                style={{
                  color: selectedCourseCode === course.code ? "#fff" : colors.text,
                  fontWeight: "600",
                }}
              >
                {course.code}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Reviews list */}
      {filteredReviews && filteredReviews.length > 0 ? (
        <FlatList
          data={filteredReviews}
          keyExtractor={(r) => String(r.reviewId)}
          renderItem={({ item }) => (
            <ReviewWidget review={item} onVoted={fetchReviews} />
          )}
          ItemSeparatorComponent={ReviewSeparator}
        />
      ) : (
        <Text className="text-colors-textSecondary text-lg text-center mt-4">
          {selectedCourseCode ? "No reviews for this selection." : "No reviews yet for this professor."}
        </Text>
      )}
    </SafeAreaView>
  );
};

export default ProfessorReviewsScreen;