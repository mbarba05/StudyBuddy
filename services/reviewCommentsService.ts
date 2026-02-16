import supabase from "@/lib/subapase";

export type ReviewCommentPublic = {
  id: number;
  created_at: string;
  review_id: number;
  parent_comment_id: number | null;
  content: string;
};

export async function getReviewComments(reviewId: number) {
  const { data, error } = await supabase
    .from("review_comments")
    .select("id, created_at, review_id, parent_comment_id, content")
    .eq("review_id", reviewId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ReviewCommentPublic[];
}

export async function addReviewComment(
  reviewId: number,
  content: string,
  parentCommentId?: number | null
) {
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

  // Return ONLY public fields (keeps anonymity in UI)
  const { data, error } = await supabase
    .from("review_comments")
    .insert([payload])
    .select("id, created_at, review_id, parent_comment_id, content")
    .single();

  if (error) throw error;
  return data as ReviewCommentPublic;
}
