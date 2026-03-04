import React, { useMemo } from "react";
import { Text, View } from "react-native";
import { ReviewDisplay } from "@/services/reviewsService";

/*
This component is responsible for computing and displaying
average statistics for a professor's reviews.
It does NOT fetch data.
It receives already-fetched reviews from the parent screen.
 */
type Props = {
  reviews: ReviewDisplay[]; // All reviews for the professor
  selectedCourseCode: string | null; // Currently selected course filter
};

//Converts letter grades to GPA points so we can compute an average.
//This allows us to average grades numerically instead of guessing.
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

/*
Safely computes an average while:
Ignoring null/undefined values
Returning how many valid values were included
Returning count allows the UI to show how many reviews contributed.
*/
function safeAvg(values: Array<number | null | undefined>) {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (nums.length === 0) return { avg: null as number | null, count: 0 };
  const sum = nums.reduce((a, b) => a + b, 0);
  return { avg: sum / nums.length, count: nums.length };
}

//Formats numbers to 1 decimal place for cleaner UI.
function fmt1(n: number | null) {
  return n == null ? "—" : n.toFixed(1);
}

//Converts averaged GPA points back into a representative letter grade.
//This makes the output more readable for users.
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

/*Computes averages from a list of reviews.
 This is reused for:
 Overall averages
 Course-specific averages
 */
function computeAverages(list: ReviewDisplay[]) {
  const diff = safeAvg(list.map((r) => r.courseDiff));
  const rating = safeAvg(list.map((r) => r.profRating));
    //Convert each letter grade to GPA points before averaging
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
  /*useMemo ensures we only recompute averages when reviews actually change.
   This prevents unnecessary recalculations on every render.
   */
  const overall = useMemo(() => computeAverages(reviews), [reviews]);
  //If a course filter is selected, compute averages only for that course.
  const courseSpecific = useMemo(() => {
    if (!selectedCourseCode) return null;
    const filtered = reviews.filter((r) => r.code === selectedCourseCode);
    return computeAverages(filtered);
  }, [reviews, selectedCourseCode]);

  return (
    <View className="w-full items-center">
      {/*Overall Card*/}
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

      {/*Course Specific Card (only when a course is selected)*/}
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