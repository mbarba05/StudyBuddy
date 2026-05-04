import { colors } from "@/assets/colors";
import AverageStuff from "@/components/features/reviews/review-averages/AverageStuff";
import ReviewWidget from "@/components/features/reviews/ReviewWidget";
import { ClassFilterButton } from "@/components/ui/Buttons";
import { LoadingScreen } from "@/components/ui/Loading";
import { ReviewSeparator, SectionSeperator } from "@/components/ui/Seperators";
import { getReviewsForProf, ReviewDisplay } from "@/services/reviewsService";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ProfessorReviewsScreen = () => {
    const { profId, profName } = useLocalSearchParams<{
        profId: string;
        profName?: string;
    }>();

    const [reviews, setReviews] = useState<ReviewDisplay[] | null>(null);
    const [loading, setLoading] = useState(true);

    // Course filter state
    const [selectedCourseCode, setSelectedCourseCode] = useState<string | null>(null);

    const fetchReviews = async () => {
        if (!profId) return;
        setLoading(true);
        const data = await getReviewsForProf(Number(profId));
        setReviews(data);
        setLoading(false);
    };

    useEffect(() => {
        if (!profId) return;
        fetchReviews();
    }, [profId]);

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
