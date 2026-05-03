import { FUNCTIONS, TABLES } from "@/lib/enumBackend";
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
    profName: string;
    code: string;
    reviewDate: string;
    grade: string;
    voteScore: number;
    myVote: -1 | 0 | 1;
}

const normalizeReview = (item: any): ReviewDisplay => {
    const d = new Date(item.created_at);
    const reviewDate = `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
    console.log("VOTESCORE: ", item);
    return {
        reviewId: item.id,
        reviewText: item.review,
        courseDiff: item.course_diff,
        profRating: item.prof_rating,
        term: item.term,
        code: item.code,
        profName: item.name,
        grade: item.grade,
        reviewDate,
        voteScore: item.vote_score ?? 0,
        myVote: item.my_vote ?? 0,
    };
};

const normalizeReviews = (rows: any[]): ReviewDisplay[] => rows.map(normalizeReview);

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
            grade: fullReview.grade,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function voteOnReview(reviewId: number, vote: 1 | 0 | -1): Promise<boolean> {
    const user = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase.rpc(FUNCTIONS.VOTE_ON_REVIEW, {
        p_review_id: reviewId,
        p_user_id: user.data.user?.id,
        p_vote: vote,
    });

    if (error) {
        console.error("Error: voteOnReview: ", error);
        return false;
    }

    const success = { data }.data;

    return success;
}

// being able to report a review and using upsert to let users edit their reviews if they try to report the same review
export async function reportReview(reviewId: number, reason: string) {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!userData?.user) return null;

    const { data, error } = await supabase
        .from("review_reports")
        .upsert(
            {
                review_id: reviewId,
                user_id: userData.user.id,
                reason,
            },
            {
                onConflict: "review_id,user_id",
            },
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getUserReviews(): Promise<ReviewDisplay[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return [];

    const { data, error } = await supabase.rpc(FUNCTIONS.GET_USER_REVIEWS, { p_user_id: userData.user.id });
    
    if (error) {
        console.error("Error, getUserReviews:", error);
        return [];
    }

    return normalizeReviews(data ?? []);
}

export const getReviewsForProf = async (profId: number): Promise<ReviewDisplay[]> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return [];

    const { data, error } = await supabase.rpc(FUNCTIONS.GET_PROF_REVIEWS, {
        p_prof_id: profId,
        p_user_id: userData.user.id,
    });

    if (error) {
        console.error("Error: getReviewsForProf: ", error);
        return [];
    }

    console.log("REVS: ", data);

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

export const updateRecentlyViewedRevForUser = async (profId: number) => {
    const user = await supabase.auth.getUser();
    if (!user) return null;

    const recentlyViewedProf = await supabase
        .from(TABLES.RECENTLY_VIEWED_PROF_FOR_USER)
        .select("*")
        .eq("prof_id", profId)
        .eq("user_id", user.data.user?.id)
        .single();

    if (recentlyViewedProf.data == null) {
        //add it
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

    if (recentlyViewedProf.error) {
        console.error("updateRecentlyViewedRevGlobal, error fetching global row", recentlyViewedProf.error);
        return;
    }

    if (recentlyViewedProf.data == null) {
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

    if (popularSearches.error) {
        console.error("getPopularSearchesForUser unable to get user popular searches", popularSearches.error);
        return null;
    }

    return popularSearches.data;
};
