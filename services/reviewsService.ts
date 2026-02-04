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
  upvotes: number;
  downvotes: number;
}

export async function submitReview(fullReview: ReviewInput) {
  const user = await supabase.auth.getUser();
  if (!user) return null;

  const reviewed = await markEnrollmentAsReviewed(fullReview.enrollmentId);
  if (!reviewed) return null;

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      enrollment_id: fullReview.enrollmentId,
      review: fullReview.review,
      course_diff: fullReview.courseDiff,
      prof_rating: fullReview.profRating,
      likes: 0,
      grade: fullReview.grade,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function voteOnReview(reviewId: number, direction: 1 | -1) {
  const { data, error } = await supabase.rpc("vote_on_review", {
    p_review_id: reviewId,
    p_direction: direction,
  });

  if (error) {
    console.error("Vote error:", error);
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : null;

  return row as { upvotes: number; downvotes: number; deleted: boolean } | null;
}

export async function getUserReviews(): Promise<ReviewDisplay[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return [];

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
    .eq("enrollment.user_id", userData.user.id);

  if (error) return [];
  return normalizeReviews(data ?? []);
}

export const getReviewsForProf = async (
  profId: number
): Promise<ReviewDisplay[]> => {
  const { data: enrollments } = await supabase
    .from(TABLES.ENROLLMENTS)
    .select(`id, course_prof:course_prof_id!inner (prof_id)`)
    .eq("course_prof.prof_id", profId);

  if (!enrollments || enrollments.length === 0) return [];

  const enrollmentIds = enrollments.map((e) => e.id as number);

  const { data, error } = await supabase
    .from(TABLES.REVIEWS)
    .select(
      `
      *,
      enrollment:enrollment_id (
        *,
        course_prof:course_prof_id (
          prof:prof_id (*),
          course:course_id (*)
        )
      )
    `
    )
    .in("enrollment_id", enrollmentIds);

  if (error) throw error;
  return normalizeReviews(data ?? []);
};

const normalizeReview = (item: any): ReviewDisplay => {
  const d = new Date(item.created_at);
  const reviewDate = `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;

  return {
    reviewId: item.id,
    reviewText: item.review,
    courseDiff: item.course_diff,
    profRating: item.prof_rating,
    likes: item.likes,
    term: item.enrollment?.term ?? "",
    code: item.enrollment?.course_prof?.course?.code ?? "",
    profName: item.enrollment?.course_prof?.prof?.name ?? "",
    grade: item.grade ?? "",
    reviewDate,
    upvotes: item.upvotes ?? 0,
    downvotes: item.downvotes ?? 0,
  };
};

const normalizeReviews = (rows: any[]): ReviewDisplay[] =>
  rows.map(normalizeReview);