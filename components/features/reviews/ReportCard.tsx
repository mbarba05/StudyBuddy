import { colors } from "@/assets/colors";
import { deleteReview, markReportsReviewed, ReportedReview } from "@/services/reportService";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import ReviewWidget from "./ReviewWidget";

type ReportCardProps = {
    report: ReportedReview;
    onRemove: (reviewId: number) => void;
};

const ReportCard = ({ report, onRemove }: ReportCardProps) => {
    const [showReasons, setShowReasons] = useState(false);

    const reviewDisplay = {
        reviewId: report.reviewId,
        reviewText: report.reviewText,
        courseDiff: report.courseDiff,
        profRating: report.profRating,
        profName: report.profName,
        code: report.code,
        term: report.term,
        grade: report.grade,
        reviewDate: report.reviewDate,
        likes: 0,
        voteScore: 0,
    };

    const handleDelete = () => {
        Alert.alert("Delete Review", "This will permanently delete the review.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    const ok = await deleteReview(report.reviewId);
                    if (ok) {
                        await markReportsReviewed(report.reviewId);
                        onRemove(report.reviewId);
                    }
                },
            },
        ]);
    };

    const handleDismiss = () => {
        Alert.alert("Dismiss Reports", "This keeps the review and clears its reports.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Dismiss",
                onPress: async () => {
                    const ok = await markReportsReviewed(report.reviewId);
                    if (ok) {
                        onRemove(report.reviewId);
                    }
                },
            },
        ]);
    };

    return (
        <View className="items-center mb-4">
            <ReviewWidget review={reviewDisplay} />

            <View className="w-[90vw] bg-colors-secondary rounded-lg border border-t-0 border-colors-text p-3 mt-[-8px] rounded-t-none">
                <View className="self-center w-full border-b border-colors-textSecondary mb-2" />
                <TouchableOpacity
                    className="flex-row items-center justify-between"
                    onPress={() => setShowReasons(!showReasons)}
                    disabled={report.reasons.length === 0}
                >
                    <Text className="text-colors-primary font-semibold text-xl">
                        {report.reportCount} Report{report.reportCount !== 1 ? "s" : ""}
                    </Text>
                    {report.reasons.length > 0 && (
                        <Ionicons name={showReasons ? "chevron-up" : "chevron-down"} size={24} color={colors.text} />
                    )}
                </TouchableOpacity>
                {showReasons && report.reasons.length > 0 && (
                    <View className="mb-1">
                        {report.reasons.map((reason, i) => (
                            <Text key={i} className="text-colors-textSecondary text-base ml-1">
                                • {reason}
                            </Text>
                        ))}
                    </View>
                )}

                <View className="flex-row mt-2 gap-3">
                    <TouchableOpacity className="flex-1 bg-red-600 rounded-lg py-2 items-center" onPress={handleDelete}>
                        <Text className="text-white font-semibold">Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-1 rounded-lg py-2 items-center"
                        style={{ backgroundColor: colors.background }}
                        onPress={handleDismiss}
                    >
                        <Text className="text-colors-text font-semibold">Dismiss</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default ReportCard;
