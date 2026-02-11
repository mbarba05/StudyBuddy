import { colors } from "@/assets/colors";
import ReviewWidget from "@/components/features/reviews/ReviewWidget";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { ReviewSeparator } from "@/components/ui/Seperators";
import { getReviewsForProf, ReviewDisplay } from "@/services/reviewsService";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, ScrollView, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
//TODO: filter by course, order by date, professor overview with ai summary, quality, grade, course diff average
const ProfessorReviewsScreen = () => {
    const { profId, profName } = useLocalSearchParams<{
        profId: string;
        profName?: string;
    }>();

    const [reviews, setReviews] = useState<ReviewDisplay[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [courseOptions, setCourseOptions] = useState<{ id: number; code: string }[]>([]);
    const [selectedCourseCode, setSelectedCourseCode] = useState<string | null>(null);

    useEffect(() => {
        if (!profId) return;

        const fetchReviews = async () => {
            setLoading(true);
            const data = await getReviewsForProf(Number(profId));
            setReviews(data);
            if (data && data.length > 0) {
                // Extract unique course codes from the reviews
                const uniqueCourses = Array.from(new Set(data.map((r) => r.code))).map((code, i) => ({ id: i, code }));
                setCourseOptions(uniqueCourses);
            }
            setLoading(false);
        };
        fetchReviews();
    }, [profId]);

    if (loading) {
        return <LoadingScreen />;
    }
    const filteredReviews = selectedCourseCode ? reviews?.filter((r) => r.code === selectedCourseCode) : reviews;

    return (
        <SafeAreaView
            className="flex-1 bg-colors-background p-4"
            edges={["top", "left", "right"]}
        >
            {/* Professor Name */}
            <Text className="color-colors-text font-semibold text-4xl mb-4 text-center">Reviews for {profName}</Text>

            {/* Course filter dropdown */}
            {courseOptions.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ marginBottom: 12 }}
                >
                    {/* "All" Button */}
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
                        <Text
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
                                backgroundColor: selectedCourseCode === course.code ? colors.secondary : colors.primary,
                                color: selectedCourseCode === course.code ? "#fff" : colors.text,
                                fontWeight: "600",
                            }}
                        >
                            {course.code}
                        </Text>
                    ))}
                </ScrollView>
            )}

            {/* Reviews List */}
            {filteredReviews && filteredReviews.length > 0 ? (
                <FlatList
                    data={filteredReviews}
                    keyExtractor={(r) => String(r.reviewId)}
                    renderItem={({ item }) => <ReviewWidget review={item} />}
                    ItemSeparatorComponent={ReviewSeparator}
                />
            ) : (
                <Text className="text-colors-textSecondary text-lg text-center mt-4">
                    No reviews for this selection.
                </Text>
            )}
        </SafeAreaView>
    );
};
export default ProfessorReviewsScreen;
