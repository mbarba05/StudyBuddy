import { TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/subapase";
import { markEnrollmentAsReviewed } from "./enrollmentService";

export interface Review {
    id: number;
    enrollmentId: number;
    review: string;
    courseDiff: number;
    profRating: number;
    likes: number;
}

export interface ReviewInput {
    enrollmentId: number;
    review: string;
    courseDiff: number;
    profRating: number;
}

export async function submitReview(fullReview: ReviewInput) {
    const user = await supabase.auth.getUser();

    if (!user) {
        console.error("No user found");
        return null;
    }
    console.log("enrollment", fullReview.enrollmentId);
    const reviewed = await markEnrollmentAsReviewed(fullReview.enrollmentId);

    if (!reviewed) return null;

    const { data, error } = await supabase
        .from("reviews")
        .insert({
            enrollment_id: fullReview.enrollmentId,
            review: fullReview.review,
            course_diff: fullReview.courseDiff,
            prof_rating: fullReview.profRating,
            likes: 0, // default
        })
        .select()
        .single();

    if (error) {
        console.error("Error submitting review:", error);
        throw error;
    }

    return data;
}

export interface ReviewDisplay {
    reviewId: number;
    reviewText: string;
    courseDiff: number;
    profRating: number;
    term: string;
    likes: number;
    profName: string;
    code: string;
    reviewDate: string;
}

export async function getUserReviews(): Promise<ReviewDisplay[]> {
    const user = await supabase.auth.getUser();

    if (!user) {
        console.error("No user found");
        return [];
    }

    const { data, error } = await supabase
        .from(TABLES.REVIEWS)
        .select(
            `id, review, course_diff, prof_rating, likes, created_at, 
        enrollment:enrollment_id (id, user_id, term, course_prof:course_prof_id (course:course_id (code), prof:prof_id(name)))`
        )
        .eq("enrollment.user_id", user.data.user?.id);

    if (error) {
        console.error("Error fetching reviews for user:", error);
        return [];
    }

    const normalizedData: ReviewDisplay[] = (data as any[]).map((item) => {
        const d = new Date(item.created_at);
        const reviewDate = `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;

        return {
            reviewId: item.id,
            reviewDate,
            reviewText: item.review,
            courseDiff: item.course_diff,
            profRating: item.prof_rating,
            likes: item.likes,
            term: item.enrollment?.term ?? "",
            code: item.enrollment?.course_prof?.course?.code ?? "",
            profName: item.enrollment?.course_prof?.prof?.name ?? "",
        };
    });

    return normalizedData;
}
