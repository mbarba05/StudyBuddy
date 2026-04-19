import { TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/supabase";
import { markEnrollmentAsReviewed } from "./enrollmentService";
import { ProfessorForSearch } from "./professorService";

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
    //upvotes: number;
    //downvotes: number;
    voteScore: number;
    myVote?: -1 | 0 | 1;
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

/*export async function voteOnReview(reviewId: number, direction: 1 | -1) {
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
}*/
export async function voteOnReview(reviewId: number, direction: 1 | -1) {
    const { data, error } = await supabase.rpc("vote_on_review", {
        p_review_id: reviewId,
        p_direction: direction,
    });

    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : null;
    return row as { vote_score: number; deleted: boolean; my_vote: number } | null;
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
        *,npx
        course_prof:course_prof_id (
          course:course_id (code),
          prof:prof_id (name)
        )
      )
    `,
        )
        .eq("enrollment.user_id", userData.user.id);

    if (error) return [];
    return normalizeReviews(data ?? []);
}

// Will count all the reviews user writes and sum up their upvotes
export async function getUserReviewScore(userId: string) {
    const { data, error } = await supabase
        .from("reviews")
        .select(
            `
            id,
            likes,
            enrollment:enrollment_id!inner (
                id,
                user_id
            )
        `,
        )
        .eq("enrollment.user_id", userId);

    if (error) {
        console.error("Error loading user score:", error);
        return { reviewCount: 0, upvoteCount: 0, totalPoints: 0 };
    }

    // Only count reviews that actually belong to this user
    const userReviews = (data as any[]).filter((r) => r.enrollment?.user_id === userId);

    const reviewCount = userReviews.length;
    const upvoteCount = userReviews.reduce((sum, review) => sum + (review.likes || 0), 0);
    const totalPoints = reviewCount + upvoteCount;

    return { reviewCount, upvoteCount, totalPoints };
}

export const getReviewsForProf = async (profId: number): Promise<ReviewDisplay[]> => {
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
    `,
        )
        .in("enrollment_id", enrollmentIds);

    if (error) throw error;
    return normalizeReviews(data ?? []);
};

// grabbing saved summaries and the data of when it was last updated/created and how many reviews the professor has
export async function getSavedSummaries(profId: number) {
    const { data, error } = await supabase
        .from("professor_summaries")
        .select("summary, review_count, updated_at")
        .eq("prof_id", profId)
        .maybeSingle();

    if (error) throw error;
    return data ?? null;
}

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
        //upvotes: item.upvotes ?? 0,
        //downvotes: item.downvotes ?? 0,
        voteScore: item.vote_score ?? 0,
    };
};

const normalizeReviews = (rows: any[]): ReviewDisplay[] => rows.map(normalizeReview);

export const updateRecentlyViewedRevForUser = async (profId: number) => {
    const user = await supabase.auth.getUser();
    if (!user) return null;

    const recentlyViewedProf = await supabase
        .from(TABLES.RECENTLY_VIEWED_PROF_FOR_USER)
        .select("*")
        .eq("prof_id", profId)
        .eq("user_id", user.data.user?.id)
        .single();
    console.log(recentlyViewedProf);

    if (recentlyViewedProf.data == null) {
        //add it
        console.log("ADDING NEW VIEW FOR USER");
        const res = await supabase.from(TABLES.RECENTLY_VIEWED_PROF_FOR_USER).insert({
            user_id: user.data.user?.id,
            prof_id: profId,
            viewed_at: new Date().toISOString(),
            viewed_count: 1,
        });

        if (res.error) console.error("updateRecentlyViewedRev, unable to insert new view for user", res.error);
    } else {
        //update it
        const currViewCount = await supabase
            .from(TABLES.RECENTLY_VIEWED_PROF_FOR_USER)
            .select("viewed_count")
            .eq("prof_id", profId)
            .eq("user_id", user.data.user?.id)
            .single(); //find old view count

        if (currViewCount.data == null) {
            console.error("updateRecentlyViewedRev, error getting the last view count");
            return;
        }

        const res = await supabase
            .from(TABLES.RECENTLY_VIEWED_PROF_FOR_USER)
            .update({
                viewed_at: new Date().toISOString(),
                viewed_count: currViewCount.data.viewed_count + 1,
            })
            .eq("prof_id", profId)
            .eq("user_id", user.data.user?.id)
            .select();

        console.log("INCREMENTING NEW VIEW FOR USER", res);

        if (res.error) {
            console.error("updateRecentlyViewedRev, unable to increment view count", res.error);
            return;
        }
    }
};

export const updateRecentlyViewedRevGlobal = async (profId: number) => {
    const recentlyViewedProf = await supabase
        .from(TABLES.RECENTLY_VIEWED_PROF_GLOBAL)
        .select("*")
        .eq("prof_id", profId)
        .maybeSingle();

    console.log(recentlyViewedProf);

    if (recentlyViewedProf.error) {
        console.error("updateRecentlyViewedRevGlobal, error fetching global row", recentlyViewedProf.error);
        return;
    }

    if (recentlyViewedProf.data == null) {
        console.log("ADDING NEW GLOBAL VIEW");

        const res = await supabase.from(TABLES.RECENTLY_VIEWED_PROF_GLOBAL).insert({
            prof_id: profId,
            viewed_at: new Date().toISOString(),
            viewed_count: 1,
        });

        if (res.error) {
            console.error("updateRecentlyViewedRevGlobal, unable to insert new global view", res.error);
            return;
        }
    } else {
        const res = await supabase
            .from(TABLES.RECENTLY_VIEWED_PROF_GLOBAL)
            .update({
                viewed_at: new Date().toISOString(),
                viewed_count: recentlyViewedProf.data.viewed_count + 1,
            })
            .eq("prof_id", profId)
            .select();

        console.log("INCREMENTING NEW GLOBAL VIEW", res);

        if (res.error) {
            console.error("updateRecentlyViewedRevGlobal, unable to increment global view count", res.error);
            return;
        }
    }
};

export const getRecentSearchesForUser = async (): Promise<ProfessorForSearch[] | null> => {
    const user = await supabase.auth.getUser();
    if (user.error) {
        console.error("getRecentSearchesForUser", user.error);
        return null;
    }

    const recentSearches = await supabase.rpc("get_recent_rev_searches_for_user", {
        p_user_id: user.data.user.id,
    });

    console.log("RECENT: ", recentSearches);

    if (recentSearches.error) {
        console.error("getRecentSearchesForUser unable to get user recent searches", recentSearches.error);
        return null;
    }

    return recentSearches.data;
};

export const getPopularSearchesByMajor = async (): Promise<ProfessorForSearch[] | null> => {
    const user = await supabase.auth.getUser();
    if (user.error) {
        console.error("getPopularSearchesForUser", user.error);
        return null;
    }

    const popularSearches = await supabase.rpc("get_popular_prof_searches_by_major", {
        p_user_id: user.data.user.id,
    });

    console.log("popular", popularSearches);

    if (popularSearches.error) {
        console.error("getPopularSearchesForUser unable to get user popular searches", popularSearches.error);
        return null;
    }

    return popularSearches.data;
};
