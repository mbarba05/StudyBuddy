import supabase from "@/lib/supabase";

export type ReviewCommentPublic = {
    id: number;
    created_at: string;
    review_id: number;
    parent_comment_id: number | null;
    content: string;

    voteScore?: number;
    myVote?: -1 | 0 | 1;
};

export async function getReviewComments(reviewId: number) {
    // get current user so we can compute myVote
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from("review_comments")
        .select("id, created_at, review_id, parent_comment_id, content")
        .eq("review_id", reviewId)
        .order("created_at", { ascending: true });

    if (error) throw error;

    const comments = (data ?? []) as ReviewCommentPublic[];
    if (comments.length === 0) return comments;

    const commentIds = comments.map((c) => c.id);

    const { data: votes, error: votesErr } = await supabase
        .from("review_comment_votes")
        .select("comment_id, user_id, vote")
        .in("comment_id", commentIds);

    if (votesErr) throw votesErr;

    const scoreMap = new Map<number, number>();
    const myVoteMap = new Map<number, -1 | 0 | 1>();

    for (const v of votes ?? []) {
        const cid = v.comment_id as number;
        const vote = v.vote as number as -1 | 1;

        scoreMap.set(cid, (scoreMap.get(cid) ?? 0) + vote);

        if (user && v.user_id === user.id) {
            myVoteMap.set(cid, vote);
        }
    }

    return comments.map((c) => ({
        ...c,
        voteScore: scoreMap.get(c.id) ?? 0,
        myVote: myVoteMap.get(c.id) ?? 0,
    }));
}

export async function addReviewComment(reviewId: number, content: string, parentCommentId?: number | null) {
    const trimmed = content.trim();
    if (!trimmed) throw new Error("Comment cannot be empty.");

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error("User not authenticated");

    const payload: {
        review_id: number;
        user_id: string;
        content: string;
        parent_comment_id: number | null;
    } = {
        review_id: reviewId,
        user_id: user.id,
        content: trimmed,
        parent_comment_id: parentCommentId ?? null,
    };

    // anonymous
    const { data, error } = await supabase
        .from("review_comments")
        .insert([payload])
        .select("id, created_at, review_id, parent_comment_id, content")
        .single();

    if (error) throw error;

    // start at 0 votes for new comment
    return { ...(data as ReviewCommentPublic), voteScore: 0, myVote: 0 };
}

export async function voteOnReviewComment(commentId: number, direction: 1 | -1) {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error("User not authenticated");

    // check existing
    const { data: existing, error: existingErr } = await supabase
        .from("review_comment_votes")
        .select("vote")
        .eq("comment_id", commentId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (existingErr) throw existingErr;

    const existingVote = (existing?.vote ?? 0) as number as -1 | 0 | 1;

    if (existingVote === direction) {
        const { error: delErr } = await supabase
            .from("review_comment_votes")
            .delete()
            .eq("comment_id", commentId)
            .eq("user_id", user.id);

        if (delErr) throw delErr;
    } else {
        // upsert
        const { error: upsertErr } = await supabase
            .from("review_comment_votes")
            .upsert({ comment_id: commentId, user_id: user.id, vote: direction }, { onConflict: "comment_id,user_id" });

        if (upsertErr) throw upsertErr;
    }

    // return fresh totals for this comment
    const { data: allVotes, error: sumErr } = await supabase
        .from("review_comment_votes")
        .select("vote, user_id")
        .eq("comment_id", commentId);

    if (sumErr) throw sumErr;

    const voteScore = (allVotes ?? []).reduce((acc, v) => acc + (v.vote as number), 0);

    const myVote = ((allVotes ?? []).find((v) => v.user_id === user.id)?.vote as -1 | 1 | undefined) ?? 0;

    return { voteScore, myVote: myVote as -1 | 0 | 1 };
}
