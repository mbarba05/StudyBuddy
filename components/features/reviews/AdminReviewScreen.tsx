import { colors } from "@/assets/colors";
import { LoadingScreen } from "@/components/ui/Loading";
import { getReportedReviews, ReportedReview } from "@/services/reportService";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import ReportCard from "./ReportCard";

const AdminReviewScreen = () => {
    const [reports, setReports] = useState<ReportedReview[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        const data = await getReportedReviews();
        setReports(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleRemove = (reviewId: number) => {
        setReports((prev) => prev?.filter((r) => r.reviewId !== reviewId) ?? []);
    };

    if (loading) return <LoadingScreen />;

    return (
        <FlatList
            data={reports ?? []}
            keyExtractor={(item) => String(item.reviewId)}
            renderItem={({ item }) => <ReportCard report={item} onRemove={handleRemove} />}
            contentContainerStyle={{ paddingVertical: 16 }}
            className="flex-1 bg-colors-background"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
            ListHeaderComponent={
                <View className="flex items-center mb-4">
                    <Text className="text-4xl text-colors-text font-semibold">Reported Reviews</Text>
                </View>
            }
            ListEmptyComponent={
                <Text className="text-2xl text-colors-textSecondary text-center">No Reported Reviews</Text>
            }
        />
    );
};

export default AdminReviewScreen;
