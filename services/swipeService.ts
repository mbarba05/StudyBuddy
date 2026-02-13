import supabase from "@/lib/subapase";

export async function recordSwipe(targetId: string, direction: "left" | "right") {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
        .from("user_swipes")
        .insert([{ swiper_id: user.id, target_id: targetId, direction }]);

    if (error) {
        console.error("Error recording swipe:", error);
        return null;
    }

    return data;
}

export async function getSwipedUserIds(swiperId: string): Promise<string[]> {
    const { data, error } = await supabase.from("user_swipes").select("target_id").eq("swiper_id", swiperId);

    if (error) {
        console.error("Error fetching swiped user IDs:", error);
        return [];
    }
    return data.map((row) => row.target_id);
}

// Check if two users have mutually swiped right on each other
export async function isMutualMatch(userId1: string, userId2: string): Promise<boolean> {
    const { data, error } = await supabase
        .from("user_swipes")
        .select("swiper_id, target_id")
        .or(
            `and(swiper_id.eq.${userId1},target_id.eq.${userId2},direction.eq.right),and(swiper_id.eq.${userId2},target_id.eq.${userId1},direction.eq.right)`,
        );

    if (error) {
        console.error("Error checking mutual match:", error);
        return false;
    }

    return data.length === 2;
}

// Send a new friend request when user swipes right.
// Adds entry to friend_requests table with pending status.
/*export async function sendFriendRequest(
  senderId: string,
  receiverId: string
) {
    // Insert new friend request record
  const { error } = await supabase.from("friend_requests").insert([
    {
      sender_id: senderId,
      receiver_id: receiverId,
      status: "pending",
    },
  ]);
  // Handle potential error
  if (error) {
    console.error("Error sending friend request:", error);
  } else {
    console.log(`Friend request sent from ${senderId} to ${receiverId}`);
  }
*/
