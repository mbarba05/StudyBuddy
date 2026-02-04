import supabase from "@/lib/subapase";

export type ReviewComment = {
  id: number;
  created_at: string;
  review_id: number;
  user_id: string;
  content: string;
};

export type CommentAuthor = {
  user_id: string;
  display_name: string | null;
  pp_url: string | null;
};

export type ReviewCommentWithAuthor = ReviewComment & {
  author: CommentAuthor | null;
};

export async function addReviewComment(reviewId: number, content: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("review_comments")
    .insert([
      {
        review_id: reviewId,
        user_id: user.id,
        content,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as ReviewComment;
}

export async function getReviewCommentCount(reviewId: number) {
  const { count, error } = await supabase
    .from("review_comments")
    .select("id", { count: "exact", head: true })
    .eq("review_id", reviewId);

  if (error) throw error;
  return count ?? 0;
}

export async function getReviewComments(reviewId: number) {
  const { data, error } = await supabase
    .from("review_comments")
    .select("id, created_at, review_id, user_id, content")
    .eq("review_id", reviewId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ReviewComment[];
}

// Get the comments with the info about author 
export async function getReviewCommentsWithAuthors(reviewId: number) {
  // 1) get comments
  const comments = await getReviewComments(reviewId);

  if (comments.length === 0) return [] as ReviewCommentWithAuthor[];

  // Get each of the userIds 
  const userIds = Array.from(new Set(comments.map((c) => c.user_id)));

  //Fetch the profiles from the userIDs
  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("user_id, display_name, pp_url")
    .in("user_id", userIds);

  if (profErr) throw profErr;

  const profileMap = new Map<string, CommentAuthor>();
  (profiles ?? []).forEach((p: any) => {
    profileMap.set(p.user_id, {
      user_id: p.user_id,
      display_name: p.display_name ?? null,
      pp_url: p.pp_url ?? null,
    });
  });

  
  return comments.map((c) => ({
    ...c,
    author: profileMap.get(c.user_id) ?? null,
  })) as ReviewCommentWithAuthor[];
}
