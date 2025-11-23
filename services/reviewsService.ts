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
    grade: string;
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
            grade: fullReview.grade,
        })
        .select()
        .single();

    //TODO: update average difficulty and grade on course_prof, and quality on prof

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
    grade: string;
}

export async function getUserReviews(): Promise<ReviewDisplay[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        console.error("No user found or error fetching user:", userError);
        return [];
    }

    const userId = userData.user.id;

    const { data, error } = await supabase
        .from(TABLES.REVIEWS)
        .select(
            `
            *,
            enrollment:enrollment_id!inner (
                *,
                course_prof:course_prof_id (
                    course:course_id (code),
                    prof:prof_id (name)
                )
            )
        `
        )
        .eq("enrollment.user_id", userId);

    if (error) {
        console.error("Error fetching reviews for user:", error);
        return [];
    }
    console.log(" deex", normalizeReviews(data));
    return normalizeReviews(data ?? []);
}

export const getReviewsForProf = async (profId: number): Promise<ReviewDisplay[]> => {
    //Get all enrollments where this professor teaches the course
    const { data: enrollments, error: enrollError } = await supabase
        .from(TABLES.ENROLLMENTS)
        .select(`id, course_prof:course_prof_id!inner (prof_id)`)
        .eq("course_prof.prof_id", profId);

    if (enrollError) {
        console.error("Error fetching enrollments for professor:", enrollError);
        throw enrollError;
    }

    if (!enrollments || enrollments.length === 0) {
        return [];
    }

    const enrollmentIds = enrollments.map((e) => e.id as number);

    //Get all reviews for those enrollments, with nested enrollment -> course_prof -> prof/course
    const { data, error } = await supabase
        .from(TABLES.REVIEWS)
        .select(
            `
            *,
            enrollment:enrollment_id (
                *,
                course_prof:course_prof_id (
                    *,
                    prof:prof_id (*),
                    course:course_id (*)
                )
            )
        `
        )
        .in("enrollment_id", enrollmentIds);

    if (error) {
        console.error("Error fetching reviews for professor:", error);
        throw error;
    }
    return normalizeReviews(data ?? []);
};

const normalizeReview = (item: any): ReviewDisplay => {
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
        grade: item.grade ?? null,
    };
};

const normalizeReviews = (rows: any[]): ReviewDisplay[] => {
    return rows.map(normalizeReview);
};
