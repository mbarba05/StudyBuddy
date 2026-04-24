import { colors } from "@/assets/colors";
import AverageStuff from "@/components/features/reviews/review-averages/AverageStuff";
import ReviewWidget from "@/components/features/reviews/ReviewWidget";
import { ClassFilterButton } from "@/components/ui/Buttons";
import { LoadingScreen } from "@/components/ui/Loading";
import { ReviewSeparator, SectionSeperator } from "@/components/ui/Seperators";
import supabase from "@/lib/supabase";
import { getReviewsForProf, getUserReviewScore, ReviewDisplay } from "@/services/reviewsService";
import { useFocusEffect } from "@react-navigation/native";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ProfessorReviewsScreen = () => {
    const { profId, profName } = useLocalSearchParams<{
        profId: string;
        profName?: string;
    }>();

    const [reviews, setReviews] = useState<ReviewDisplay[] | null>(null);
    const [loading, setLoading] = useState(true);

    // Auth state for “myVote” hydration
    const [userId, setUserId] = useState<string | null | undefined>(undefined);

    const [reviewCount, setReviewCount] = useState(0);
    const [totalPoints, setTotalPoints] = useState(0);

    // Course filter state
    const [selectedCourseCode, setSelectedCourseCode] = useState<string | null>(null);

    // 1) Hydrate auth session + listen for changes
    useEffect(() => {
        const init = async () => {
            const { data } = await supabase.auth.getSession();
            setUserId(data.session?.user?.id ?? null);

            if (data.session?.user?.id) {
                const score = await getUserReviewScore(data.session.user.id);
                setReviewCount(score.reviewCount);
                setTotalPoints(score.totalPoints);
            }
        };

        init();

        const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUserId(session?.user?.id ?? null);

            if (session?.user?.id) {
                const score = await getUserReviewScore(session.user.id);
                setReviewCount(score.reviewCount);
                setTotalPoints(score.totalPoints);
            }
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
        }, [fetchReviews, profId, userId]),
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

    const header = () => (
        <View className="flex items-center">
            <Text className="text-colors-textSecondary text-lg font-semibold">Reviews for:</Text>
            <Text className="text-colors-text text-2xl font-semibold">{profName}</Text>
        </View>
    );

    const reviewsTexts = useMemo(() => {
        const list = reviews ?? [];
        return list
            .map((r) => (r.reviewText ?? "").trim())
            .filter(Boolean)
            .slice(0, 120);
    }, [reviews]);

    if (loading) return <LoadingScreen />;

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: header,
                    headerStyle: { backgroundColor: colors.background },
                    headerBackTitle: "Search",
                }}
            />
            <SafeAreaView className="flex-1 bg-colors-background" edges={["left", "right"]}>
                {/* Course filter */}
                {courseOptions.length > 0 && (
                    <View className="border-y border-colors-textSecondary w-full py-2">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View className="flex-row gap-3 justify-center items-center ml-4">
                                <ClassFilterButton
                                    selected={selectedCourseCode === null}
                                    onPress={() => setSelectedCourseCode(null)}
                                >
                                    All
                                </ClassFilterButton>

                                {courseOptions.map((course) => (
                                    <ClassFilterButton
                                        onPress={() =>
                                            setSelectedCourseCode(
                                                selectedCourseCode === course.code ? null : course.code,
                                            )
                                        }
                                        selected={selectedCourseCode === course.code}
                                        key={course.id}
                                    >
                                        {course.code}
                                    </ClassFilterButton>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )}

                <ScrollView
                    contentContainerStyle={{
                        paddingTop: 2,
                        paddingBottom: 20,
                        alignItems: "center",
                    }}
                >
                    <View className="self-center py-4">
                        <AverageStuff
                            reviews={reviews ?? []}
                            selectedCourseCode={selectedCourseCode}
                            profId={Number(profId)}
                            professorName={profName ?? "unknown"}
                        />
                    </View>
                    <SectionSeperator />
                    <View className="h-4" />
                    {filteredReviews && filteredReviews.length > 0 ? (
                        filteredReviews.map((item, index) => (
                            <React.Fragment key={item.reviewId}>
                                {index > 0 && <ReviewSeparator />}
                                <ReviewWidget review={item} onVoted={fetchReviews} />
                            </React.Fragment>
                        ))
                    ) : (
                        <Text className="text-colors-textSecondary text-lg text-center mt-4">
                            {selectedCourseCode
                                ? "No reviews for this selection."
                                : "No reviews yet for this professor."}
                        </Text>
                    )}
                </ScrollView>
            </SafeAreaView>
        </>
    );
};

export default ProfessorReviewsScreen;
