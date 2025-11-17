import LoadingScreen from "@/components/ui/LoadingScreen";
import { getReviewableEnrollments, ReviewableEnrollment } from "@/services/enrollmentService";
import { getUserReviews, ReviewDisplay } from "@/services/reviewsService";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import CourseProfDisplayWidget from "../courses/CourseProfDisplayWidget";
import ReviewWidget from "./ReviewWidget";
import WriteReviewModal from "./WriteReviewModal";

const YourReviewsScreen = () => {
    const [reviewableEnrollments, setReviewableEnrollments] = useState<ReviewableEnrollment[] | null>(null);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState<ReviewableEnrollment | null>(null);
    const [reviews, setReviews] = useState<ReviewDisplay[] | null>();
    const [loading, setLoading] = useState(true);
    console.log("REV", reviews);
    const getData = async () => {
        const enrollments = await getReviewableEnrollments();
        const review = await getUserReviews();
        if (enrollments) setReviewableEnrollments(enrollments);
        setReviews(review);
    };

    useEffect(() => {
        setLoading(true);
        getData();
        setLoading(false);
    }, []);

    const openReviewModal = (enrollment: ReviewableEnrollment) => {
        //pass the state of enrollment to the modal here
        setSelectedEnrollment(enrollment);
        setReviewModalVisible(true);
    };

    if (loading) return <LoadingScreen />;

    return (
        <View className="flex-1 gap-4 p-2 bg-colors-background">
            {reviewableEnrollments && reviewableEnrollments.length > 0 && (
                <View className="flex items-center">
                    <Text className="text-4xl text-colors-text font-semibold">Write your Reviews!</Text>
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
                <Text className="text-4xl text-colors-text font-semibold">View your Reviews</Text>
                {reviews &&
                    reviews.map((r) => (
                        <View key={r.reviewId}>
                            <ReviewWidget review={r} />
                        </View>
                    ))}
            </View>
            <WriteReviewModal
                visible={reviewModalVisible}
                setVisible={setReviewModalVisible}
                selectedEnrollment={selectedEnrollment as ReviewableEnrollment}
                onSubmit={getData}
            />
        </View>
    );
};

export default YourReviewsScreen;
