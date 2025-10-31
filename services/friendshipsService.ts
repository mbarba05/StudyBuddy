import supabase from "@/lib/subapase";


// Sends friend request 
export async function sendFriendRequest(userId: string, friendId: string) {
  const { data, error } = await supabase
    .from("friendships")
    .insert([{ user_id: userId, friend_id: friendId, status: "pending" }])
    .select();

  if (error) {
    console.error("Error sending friend request:", error);
    throw error;
  }
  return data;
}

// Accept a pending friend request and changes user status to as "accepted"
export async function acceptFriendRequest(requestId: string) {
  const { data, error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", requestId)
    .select();

  if (error) {
    console.error("Error accepting friend request:", error);
    throw error;
  }
  return data;
}

// Get the friend requesrts 
export async function getUserFriends(userId: string) {
  const { data, error } = await supabase
    .from("friendships")
    .select(
      `
        id,
        status,
        user_id,
        friend_id,
        profiles!friend_id(display_name, pp_url)
      `
    )
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq("status", "accepted");

  if (error) {
    console.error("Error fetching user friends:", error);
    throw error;
  }
  return data;
}

// Get all pending friend requests from the user 
export async function getPendingRequests(userId: string) {
  const { data, error } = await supabase
    .from("friendships")
    .select(
      `
        id,
        user_id,
        friend_id,
        status,
        profiles!user_id(display_name, pp_url)
      `
    )
    .eq("friend_id", userId)
    .eq("status", "pending");

  if (error) {
    console.error("Error fetching pending requests:", error);
    throw error;
  }
  return data;
}

// Remove a friend and deletes id from table in supabase 
export async function removeFriendship(id: string) {
  const { error } = await supabase.from("friendships").delete().eq("id", id);
  if (error) {
    console.error("Error deleting friendship:", error);
    throw error;
  }
  return true;
}
