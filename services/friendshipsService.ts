import supabase from "@/lib/subapase";
import { TABLES } from "@/lib/enumBackend";

export type FriendStatus = "pending" | "accepted" | "rejected";

export type Friendship = {
  id: number;
  created_at: string;
  user_id: string;
  friend_id: string;
  status: FriendStatus;
};

export type FriendRequest = {
  id: number;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  status: FriendStatus;
};

export async function sendFriendRequest(receiver_id: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from(TABLES.FRIEND_REQUESTS)
    .insert([{ sender_id: user.id, receiver_id, status: "pending" }])
    .select()
    .single();

  if (error) throw error;
  return data as FriendRequest;
}

export async function getIncomingFriendRequests(user_id: string) {
  const { data, error } = await supabase
    .from(TABLES.FRIEND_REQUESTS)
    .select(
      `
      id,
      created_at,
      sender_id,
      receiver_id,
      status,
      sender:profiles!friend_requests_sender_id_fkey (
        user_id,
        display_name,
        pp_url
      )
    `
    )
    .eq("receiver_id", user_id)
    .eq("status", "pending");

  if (error) throw error;
  return data as FriendRequest[];
}

export async function getOutgoingFriendRequests(user_id: string) {
  const { data, error } = await supabase
    .from(TABLES.FRIEND_REQUESTS)
    .select(
      `
      id,
      created_at,
      sender_id,
      receiver_id,
      status,
      receiver:profiles!friend_requests_receiver_id_fkey (
        user_id,
        display_name,
        pp_url
      )
    `
    )
    .eq("sender_id", user_id)
    .eq("status", "pending");

  if (error) throw error;
  return data as FriendRequest[];
}

// Accept incoming friend request 
export async function acceptFriendRequest(request: FriendRequest) {
  // Update request to "accepted"
  const { error: updateErr } = await supabase
    .from(TABLES.FRIEND_REQUESTS)
    .update({ status: "accepted" })
    .eq("id", request.id);

  if (updateErr) throw updateErr;

  // Insert mutual friendship entries
  const { error: insertErr } = await supabase
    .from(TABLES.FRIENDSHIPS)
    .insert([
      {
        user_id: request.sender_id,
        friend_id: request.receiver_id,
        status: "accepted",
      },
      {
        user_id: request.receiver_id,
        friend_id: request.sender_id,
        status: "accepted",
      },
    ]);

  if (insertErr) throw insertErr;
}

// Reject friend request 
export async function rejectFriendRequest(request_id: number) {
  const { error } = await supabase
    .from(TABLES.FRIEND_REQUESTS)
    .update({ status: "rejected" })
    .eq("id", request_id);

  if (error) throw error;
}

// Get friends 
export async function getFriends(user_id: string) {
  const { data, error } = await supabase
    .from(TABLES.FRIENDSHIPS)
    .select(
      `
      id,
      created_at,
      user_id,
      friend_id,
      status,
      friend:profiles!friendships_friend_id_fkey (
        user_id,
        display_name,
        pp_url
      )
    `
    )
    .eq("user_id", user_id)
    .eq("status", "accepted");

  if (error) throw error;
  return data as Friendship[];
}

// Removes friends but needss to be checked on mobile 
export async function removeFriend(user_id: string, friend_id: string) {
  const { error } = await supabase
    .from(TABLES.FRIENDSHIPS)
    .delete()
    .or(
      `and(user_id.eq.${user_id},friend_id.eq.${friend_id}),
       and(user_id.eq.${friend_id},friend_id.eq.${user_id})`
    );

  if (error) throw error;
}

// Checks if both users are already friends 
export async function areFriends(user_id: string, friend_id: string) {
  const { data, error } = await supabase
    .from(TABLES.FRIENDSHIPS)
    .select("id")
    .or(
      `and(user_id.eq.${user_id},friend_id.eq.${friend_id}),
       and(user_id.eq.${friend_id},friend_id.eq.${user_id})`
    )
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

// Friends count for the profile screen 
export async function getFriendsCount(user_id: string) {
  const { count, error } = await supabase
    .from(TABLES.FRIENDSHIPS)
    .select("*", { count: "exact", head: true })
    .eq("user_id", user_id)
    .eq("status", "accepted");

  if (error) {
    console.error("getFriendsCount error:", error);
    return 0;
  }

  return count || 0;
}


// Get all friends 
export async function getAllFriends(user_id: string) {
  const { data, error } = await supabase
    .from(TABLES.FRIENDSHIPS)
    .select(`
      id,
      user_id,
      friend_id,
      status,
      userProfile:profiles!friendships_user_id_fkey (
        user_id,
        display_name,
        pp_url,
        major_id,
        year
      ),
      friendProfile:profiles!friendships_friend_id_fkey (
        user_id,
        display_name,
        pp_url,
        major_id,
        year
      )
    `)
    .or(`user_id.eq.${user_id}, friend_id.eq.${user_id}`)
    .eq("status", "accepted");

  if (error) {
    console.error("getAllFriends error:", error);
    return [];
  }

  return data.map((row) => {
    // if I am user_id → friend is friendProfile
    const isUserSender = row.user_id === user_id;
    const profile = isUserSender ? row.friendProfile : row.userProfile;

    return {
      friend_id: profile.user_id,
      full_name: profile.display_name,
      avatar_url: profile.pp_url,
      major_id: profile.major_id,
      year: profile.year,
    };
  });
}