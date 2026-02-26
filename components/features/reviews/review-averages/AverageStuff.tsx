import React, { useMemo } from "react";
import { Text, View } from "react-native";
import { ReviewDisplay } from "@/services/reviewsService";

type Props = {
  reviews: ReviewDisplay[];
  selectedCourseCode: string | null;
};

const letterToPoints: Record<string, number> = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  "D-": 0.7,
  F: 0.0,
};

function safeAvg(values: Array<number | null | undefined>) {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (nums.length === 0) return { avg: null as number | null, count: 0 };
  const sum = nums.reduce((a, b) => a + b, 0);
  return { avg: sum / nums.length, count: nums.length };
}

function fmt1(n: number | null) {
  return n == null ? "—" : n.toFixed(1);
}

function pointsToLetter(points: number | null) {
  if (points == null) return "—";
  if (points >= 3.85) return "A";
  if (points >= 3.5) return "A-";
  if (points >= 3.15) return "B+";
  if (points >= 2.85) return "B";
  if (points >= 2.5) return "B-";
  if (points >= 2.15) return "C+";
  if (points >= 1.85) return "C";
  if (points >= 1.5) return "C-";
  if (points >= 1.15) return "D+";
  if (points >= 0.85) return "D";
  if (points >= 0.5) return "D-";
  return "F";
}

function computeAverages(list: ReviewDisplay[]) {
  const diff = safeAvg(list.map((r) => r.courseDiff));
  const rating = safeAvg(list.map((r) => r.profRating));

  const gpa = safeAvg(
    list.map((r) => {
      const g = (r.grade ?? "").trim().toUpperCase();
      return letterToPoints[g] ?? null;
    }),
  );

  return {
    total: list.length,
    diffAvg: diff.avg,
    diffCount: diff.count,
    ratingAvg: rating.avg,
    ratingCount: rating.count,
    gpaAvg: gpa.avg,
    gpaCount: gpa.count,
    gradeLetter: pointsToLetter(gpa.avg),
  };
}

export default function AverageStuff({ reviews, selectedCourseCode }: Props) {
  const overall = useMemo(() => computeAverages(reviews), [reviews]);

  const courseSpecific = useMemo(() => {
    if (!selectedCourseCode) return null;
    const filtered = reviews.filter((r) => r.code === selectedCourseCode);
    return computeAverages(filtered);
  }, [reviews, selectedCourseCode]);

  return (
    <View className="w-full items-center">
      {/* OVERALL CARD */}
      <AvgCard
        title="Averages"
        subtitle={`${overall.total} review${overall.total === 1 ? "" : "s"}`}
        avgGrade={overall.gradeLetter}
        avgGpa={overall.gpaAvg}
        avgDifficulty={overall.diffAvg}
        avgRating={overall.ratingAvg}
        gradeCount={overall.gpaCount}
        diffCount={overall.diffCount}
        ratingCount={overall.ratingCount}
      />

      {/* COURSE-SPECIFIC CARD (only when a course is selected) */}
      {selectedCourseCode && courseSpecific && (
        <View className="mt-4">
          <AvgCard
            title={`Averages for ${selectedCourseCode}`}
            subtitle={`${courseSpecific.total} review${courseSpecific.total === 1 ? "" : "s"}`}
            avgGrade={courseSpecific.gradeLetter}
            avgGpa={courseSpecific.gpaAvg}
            avgDifficulty={courseSpecific.diffAvg}
            avgRating={courseSpecific.ratingAvg}
            gradeCount={courseSpecific.gpaCount}
            diffCount={courseSpecific.diffCount}
            ratingCount={courseSpecific.ratingCount}
          />
        </View>
      )}
    </View>
  );
}

function AvgCard(props: {
  title: string;
  subtitle: string;
  avgGrade: string;
  avgGpa: number | null;
  avgDifficulty: number | null;
  avgRating: number | null;
  gradeCount: number;
  diffCount: number;
  ratingCount: number;
}) {
  return (
    <View className="bg-colors-secondary w-[90vw] rounded-lg border border-colors-text p-3 gap-3 shadow-md">
      <View className="flex-row justify-between items-end">
        <Text className="color-colors-text text-2xl font-semibold">{props.title}</Text>
        <Text className="color-colors-textSecondary text-sm">{props.subtitle}</Text>
      </View>

      <View className="flex-row justify-between">
        <StatCol
          label="Avg Grade"
          value={props.avgGrade}
          sub={props.gradeCount > 0 ? `${fmt1(props.avgGpa)}/4.0` : "—"}
        />
        <StatCol
          label="Avg Difficulty"
          value={fmt1(props.avgDifficulty)}
          sub={props.diffCount > 0 ? `${props.diffCount} filled` : "—"}
        />
        <StatCol
          label="Avg Rating"
          value={fmt1(props.avgRating)}
          sub={props.ratingCount > 0 ? `${props.ratingCount} filled` : "—"}
        />
      </View>

      <View className="border-t border-colors-textSecondary pt-2">
        <Text className="color-colors-textSecondary text-xs text-center">
          Grade uses a 4.0 scale (A=4.0, B=3.0, etc.)
        </Text>
      </View>
    </View>
  );
}

function StatCol({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View className="flex items-center flex-1">
      <Text className="color-colors-textSecondary text-lg">{label}</Text>
      <Text className="color-colors-text text-2xl font-semibold">{value}</Text>
      <Text className="color-colors-textSecondary text-xs">{sub}</Text>
    </View>
  );
}