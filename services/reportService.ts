import { TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/supabase";

export interface ReportedReview {
    reviewId: number;
    reviewText: string;
    courseDiff: number;
    profRating: number;
    profName: string;
    code: string;
    term: string;
    grade: string;
    reviewDate: string;
    reportCount: number;
    reasons: string[];
}

export async function getReportedReviews(): Promise<ReportedReview[]> {
    const { data, error } = await supabase
        .from(TABLES.REVIEW_REPORTS)
        .select(
            `
            id,
            review_id,
            reason,
            created_at,
            review:review_id (
                id,
                review,
                course_diff,
                prof_rating,
                grade,
                created_at,
                enrollment:enrollment_id (
                    term,
                    course_prof:course_prof_id (
                        course:course_id (code),
                        prof:prof_id (name)
                    )
                )
            )
        `,
        )
        .eq("reviewed", 0)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("getReportedReviews:", error);
        return [];
    }

    // Group by review_id, count reports, collect reasons
    const grouped = new Map<number, { review: any; reasons: string[]; count: number }>();

    for (const row of (data ?? []) as any[]) {
        const rid = row.review_id;
        const existing = grouped.get(rid);
        if (existing) {
            existing.count++;
            if (row.reason) existing.reasons.push(row.reason);
        } else {
            grouped.set(rid, {
                review: row.review,
                reasons: row.reason ? [row.reason] : [],
                count: 1,
            });
        }
    }

    // Normalize and sort by report count descending
    const results: ReportedReview[] = [];
    for (const [reviewId, { review, reasons, count }] of grouped) {
        if (!review) continue;
        const d = new Date(review.created_at);
        const reviewDate = `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;

        results.push({
            reviewId,
            reviewText: review.review ?? "",
            courseDiff: review.course_diff ?? 0,
            profRating: review.prof_rating ?? 0,
            profName: review.enrollment?.course_prof?.prof?.name ?? "",
            code: review.enrollment?.course_prof?.course?.code ?? "",
            term: review.enrollment?.term ?? "",
            grade: review.grade ?? "",
            reviewDate,
            reportCount: count,
            reasons,
        });
    }

    results.sort((a, b) => b.reportCount - a.reportCount);
    return results;
}

export async function deleteReview(reviewId: number): Promise<boolean> {
    const { error } = await supabase.from(TABLES.REVIEWS).delete().eq("id", reviewId);

    if (error) {
        console.error("deleteReview:", error);
        return false;
    }
    return true;
}

export async function markReportsReviewed(reviewId: number): Promise<boolean> {
    const { error } = await supabase
        .from(TABLES.REVIEW_REPORTS)
        .update({ reviewed: 1 })
        .eq("review_id", reviewId);

    if (error) {
        console.error("markReportsReviewed:", error);
        return false;
    }
    return true;
}
