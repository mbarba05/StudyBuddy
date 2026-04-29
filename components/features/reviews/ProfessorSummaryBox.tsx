import { getProfessorSummary } from "@/services/aiSummary";
import { ReviewDisplay } from "@/services/reviewsService";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

// array of the reviews
type Props = {
    profId: number;
    professorName?: string;
    reviews: ReviewDisplay[];
    selectedCourseCode: string | null;
};

export default function ProfessorSummaryBox({ profId, professorName }: Props) {
    const [summary, setSummary] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError(null);

            try {
                const s = await getProfessorSummary(profId, professorName ?? "Professor");
                if (cancelled) return;
                setSummary(s);
            } catch (e: any) {
                if (cancelled) return;
                setError(e?.message ?? "Summary failed to generate :( ");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [profId]);
    const cleanSummary = summary.replace(/\*\*/g, "");
    return (
        //summary without a box
        // <View>
        //     <Text className="color-colors-text text-lg font-semibold text-center">AI Professor Summary:</Text>
        //     {loading ? (
        //         <View style={{ alignItems: "center" }}>
        //             <ActivityIndicator />
        //             <Text className="color-colors-textSecondary text-center">Generating summary...</Text>
        //         </View>
        //     ) : error ? (
        //         <Text className="color-colors-textSecondary text-center">{error}</Text>
        //     ) : (
        //         <Text className="color-colors-textSecondary text-center">{summary || "waiting for reviews..."}</Text>
        //     )}
        // </View>
        //this has summary inside a box
        <ScrollView className=" w-full mt-2 p-3 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md shadow-lg ">
            <Text className="color-colors-text text-lg font-semibold text-center">AI Professor Summary:</Text>
            {loading ? (
                <View style={{ alignItems: "center" }}>
                    <ActivityIndicator />
                    <Text className="color-colors-textSecondary text-center">Generating summary...</Text>
                </View>
            ) : error ? (
                <Text className="color-colors-textSecondary text-center">{error}</Text>
            ) : (
                <Text className="color-colors-textSecondary text-center">
                    {cleanSummary || "waiting for reviews..."}
                </Text>
            )}
        </ScrollView>
    );
}
