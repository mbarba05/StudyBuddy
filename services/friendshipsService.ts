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

// Send a friend request
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

// Get all the incoming friend requests from the other users
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

// Outgoing friend requests (sent by user)
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

// Accept the friend request and creates it on both ends if it gets accepted
export async function acceptFriendRequest(request: FriendRequest) {
  const { error: updateErr } = await supabase
    .from(TABLES.FRIEND_REQUESTS)
    .update({ status: "accepted" })
    .eq("id", request.id);

  if (updateErr) throw updateErr;

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

// Reject a friend request
export async function rejectFriendRequest(request_id: number) {
  const { error } = await supabase
    .from(TABLES.FRIEND_REQUESTS)
    .update({ status: "rejected" })
    .eq("id", request_id);

  if (error) throw error;
}

// Get friends from the user
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

// Removes a friend from both ends the user and the other
export async function removeFriend(user_id: string, friend_id: string) {
  const { error } = await supabase
    .from(TABLES.FRIENDSHIPS)
    .delete()
    .or(
      `and(user_id.eq.${user_id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user_id})`
    );

  if (error) throw error;
}

// Checks if two different users are friends already 
export async function areFriends(user_id: string, friend_id: string) {
  const { data, error } = await supabase
    .from(TABLES.FRIENDSHIPS)
    .select("id")
    .or(
      `and(user_id.eq.${user_id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user_id})`
    )
    .maybeSingle();

  if (error) throw error;
  return !!data;
}
