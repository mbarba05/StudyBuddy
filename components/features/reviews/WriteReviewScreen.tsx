import LoadingScreen from "@/components/ui/LoadingScreen";
import supabase from "@/lib/subapase";
import { getReviewableEnrollments, ReviewableEnrollment } from "@/services/enrollmentService";
import { getUserReviews, getUserReviewScore, ReviewDisplay } from "@/services/reviewsService";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import CourseProfDisplayWidget from "../courses/CourseProfDisplayWidget";
import ReviewWidget from "./ReviewWidget";
import WriteReviewModal from "./WriteReviewModal";

const YourReviewsScreen = () => {
    const [reviewableEnrollments, setReviewableEnrollments] = useState<ReviewableEnrollment[] | null>(null);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState<ReviewableEnrollment | null>(null);
    const [reviews, setReviews] = useState<ReviewDisplay[] | null>();
    const [loading, setLoading] = useState(true);

    const [reviewCount, setReviewCount] = useState(0);
    const [totalPoints, setTotalPoints] = useState(0);

    // Loads the user's review score (total reviews and points) and updates state
    const loadScore = async () => {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id;
        if (!userId) return;

        const score = await getUserReviewScore(userId);
        setReviewCount(score.reviewCount);
        setTotalPoints(score.totalPoints);
    };

    useEffect(() => {
        loadScore();
    }, []);

    //  getData() can safely call loadScore()
    const getData = async () => {
        const enrollments = await getReviewableEnrollments();
        const reviewList = await getUserReviews();

        if (enrollments) setReviewableEnrollments(enrollments);

        if (!reviewList || reviewList.length === 0) {
            setReviews(reviewList);
            await loadScore();
            return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user?.id;

        if (!userId) {
            setReviews(reviewList.map((r) => ({ ...r, myVote: 0 })));
            await loadScore();
            return;
        }

        const reviewIds = reviewList.map((r) => r.reviewId);

        const { data: voteRows, error } = await supabase
            .from("review_votes")
            .select("review_id, vote")
            .in("review_id", reviewIds)
            .eq("user_id", userId);

        if (error) {
            console.log("Error fetching my votes (WriteReviewScreen):", error);
            setReviews(reviewList.map((r) => ({ ...r, myVote: 0 })));
            await loadScore();
            return;
        }

        const myVoteMap = new Map<number, -1 | 1>();
        for (const row of voteRows ?? []) {
            myVoteMap.set(row.review_id, row.vote as -1 | 1);
        }

        const merged = reviewList.map((r) => ({
            ...r,
            myVote: (myVoteMap.get(r.reviewId) ?? 0) as -1 | 0 | 1,
        }));

        setReviews(merged);

        // Refresh score AFTER reviews load
        await loadScore();
    };

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            await getData();
            setLoading(false);
        };
        run();
    }, []);

    const openReviewModal = (enrollment: ReviewableEnrollment) => {
        //pass the state of enrollment to the modal here
        setSelectedEnrollment(enrollment);
        setReviewModalVisible(true);
    };

    if (loading) return <LoadingScreen />;

    return (
        <ScrollView className="flex-1 bg-colors-background">
            <View className="gap-4 p-2">
                {/* when you cant write any reviews yet, make it so that we show the end date of the semester so they know when thay can review
                also we should consider splitting into 4 tabs, search prof, search course, your reviews, write reviews*/}

                {reviewableEnrollments && reviewableEnrollments.length > 0 && (
                    <View className="flex items-center">
                        <Text className="text-4xl text-colors-text font-semibold">Write your Reviews</Text>
                        <Text className="text-lg text-colors-textSecondary">Choose Course</Text>
                        <View className="flex-row justify-center flex-wrap gap-4 mt-2">
                            {reviewableEnrollments.map((enrollment) => (
                                <TouchableOpacity
                                    key={enrollment.enrollmentId}
                                    onPress={() => openReviewModal(enrollment)}
                                >
                                    <CourseProfDisplayWidget
                                        code={enrollment.course.code}
                                        name={enrollment.prof.name}
                                        term={enrollment.term}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
                <View className="flex items-center gap-4">
                    <Text className="text-4xl text-colors-text font-semibold mb-2">View your Reviews</Text>
                    <View className="flex-row justify-between w-full px-4 mt-3 mb-5">
                        <Text className="text-lg font-semibold text-colors-textSecondary">
                            Reviews written: {reviewCount}
                        </Text>
                        <Text className="text-lg font-semibold text-colors-text">Total points: {totalPoints}</Text>
                    </View>
                </View>
                <View className="flex gap-4">
                    {reviews && reviews.length !== 0 ? (
                        reviews.map((r) => (
                            <View key={r.reviewId}>
                                <ReviewWidget review={r} onVoted={getData} />
                            </View>
                        ))
                    ) : (
                        <Text className="text-2xl text-colors-textSecondary">No Reviews Yet</Text>
                    )}
                </View>
                <WriteReviewModal
                    visible={reviewModalVisible}
                    setVisible={setReviewModalVisible}
                    selectedEnrollment={selectedEnrollment as ReviewableEnrollment}
                    onSubmit={getData}
                />
            </View>
        </ScrollView>
    );
};

export default YourReviewsScreen;
