import supabase from "@/lib/subapase";
import { sendFriendRequest } from "./friendshipsService";

// Record a swipe event in the user_swipes table. If it's a right swipe, also create a friend request.
export async function recordSwipe(
    // ID of the user performing the swipe
  swiperId: string,
    // ID of the user being swiped on
  targetId: string,
    // Direction of the swipe: "left" or "right"
  direction: "left" | "right"
) {
    // Insert swipe record into user_swipes table
  const { error } = await supabase.from("user_swipes").insert([
    // New swipe record
    { swiper_id: swiperId, target_id: targetId, direction },
  ]);
// Handle potential error
  if (error) {
    console.error("Error recording swipe:", error);
  } else {
    console.log(`Swipe recorded: ${direction} on ${targetId}`);
  }

  // Also create friend request for right swipes
  if (direction === "right") {
    await sendFriendRequest(targetId);
  }
}


    // Fetch IDs of users that this user has already swiped on.
export async function getSwipedUserIds(swiperId: string): Promise<string[]> {
    // Query user_swipes table for target IDs
  const { data, error } = await supabase
    // Select target_id where swiper_id matches
    .from("user_swipes")
    // Get target IDs swiped on by the user
    .select("target_id")
    // Filter by swiper_id
    .eq("swiper_id", swiperId);
  // Handle potential error
  if (error) {
    console.error("Error fetching swiped user IDs:", error);
    return [];
  }
  // Extract and return array of target IDs
  return data.map((row) => row.target_id);
}

// Check if two users have mutually swiped right on each other
export async function isMutualMatch(userId1: string, userId2: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_swipes")
    .select("swiper_id, target_id")
    .or(`and(swiper_id.eq.${userId1},target_id.eq.${userId2},direction.eq.right),and(swiper_id.eq.${userId2},target_id.eq.${userId1},direction.eq.right)`);

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
}*/