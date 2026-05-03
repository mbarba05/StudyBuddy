import { getProfessorSummary } from "@/services/aiSummary";
import { ReviewDisplay } from "@/services/reviewsService";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

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

    // const cleanSummary = summary.replace(/\*\*/g, "");
    const cleanSummary = (text: string) => {
        const lines = text
            .replace(/\*\*/g, "")
            .replace(/\r/g, "")
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);

        const result: string[] = [];
        const complaints: string[] = [];

        let insideComplaints = false;

        //removing * from the listing of complaints
        for (const rawline of lines) {
            const line = rawline
                .replace(/^[-*•]\s*/, "")
                .replace(/^\d+\s*[\).]\.?\s*/, "")
                .trim();

            const isComplaintHeader = /^Common complaints\s*:?\s*/i.test(line);
            if (isComplaintHeader) {
                insideComplaints = true;

                const textAfterHeader = line.replace(/^Common complaints\s*:?\s*/i, "").trim();

                const meansNone = /^(none|no common complaints|n\/a|not applicable|none mentioned|not mentioned)/i.test(
                    textAfterHeader,
                );

                if (textAfterHeader && !meansNone) {
                    complaints.push(textAfterHeader);
                }
                continue;
            }
            if (insideComplaints) {
                const meansNone = /^(none|no common complaints|n\/a|not applicable|none mentioned|not mentioned)/i.test(
                    line,
                );
                if (!meansNone) {
                    complaints.push(line);
                }
                continue;
            }
            result.push(line);
        }
        if (complaints.length > 0) {
            result.push("Common Complaints:");
            result.push(...complaints.map((complaint) => `• ${complaint}`));
        }
        return result.join("\n");
    };
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
        <View className="w-full mt-2 rounded-lg shadow-lg ">
            <Text className="color-colors-text text-2xl font-semibold text-left mb-3">Summary</Text>
            {loading ? (
                <View className="items-center">
                    <ActivityIndicator />
                    <Text className="color-colors-textSecondary text-center">Generating summary...</Text>
                </View>
            ) : error ? (
                <Text className="color-colors-textSecondary text-center">{error}</Text>
            ) : (
                <Text className="color-colors-textSecondary text-center">
                    {cleanSummary(summary) || "waiting for reviews..."}
                </Text>
            )}
        </View>
    );
}
