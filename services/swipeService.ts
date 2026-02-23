import supabase from "@/lib/subapase";

// total number of swipes allowed per day
export const MAX_SWIPES = 15;
export const WINDOW_MS = 24 * 60 * 60 * 1000; // this sets variable to 24 hours
//const WINDOW_MS = 15 * 1000; // 15 seconds for testing

export class SwipeLimitErr extends Error {
    name = "SwipeLimitErr";
    resetAtISO?: string;
    remaining?: number;
    constructor(message: string, opts?: { resetAtISO?: string; remaining?: number }) {
        super(message);
        this.resetAtISO = opts?.resetAtISO;
        this.remaining = opts?.remaining;
    }
}

export function windowStartIso(): string {
    return new Date(Date.now() - WINDOW_MS).toISOString();
}

//function to get how many swiped were made in the last 24 hours
export async function swipeTracker(swiperId: string): Promise<number> {
    const { count, error } = await supabase
        .from("user_swipes")
        .select("id", { count: "exact", head: true })
        .eq("swiper_id", swiperId)
        .gte("created_at", windowStartIso());

    if (error) throw error;
    return count ?? 0;
}

// determining when the count restarts
export async function swipeResetafter24(swiperId: string): Promise<string | undefined> {
    const { data, error } = await supabase
        .from("user_swipes")
        .select("created_at")
        .eq("swiper_id", swiperId)
        .gte("created_at", windowStartIso())
        .order("created_at", { ascending: true })
        .limit(1);

    if (error) throw error;

    const latestSwiped = data?.[0]?.created_at;
    if (!latestSwiped) return undefined;

    return new Date(new Date(latestSwiped).getTime() + WINDOW_MS).toISOString();
}

export async function getSwipeStatus() {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error("User not Authenticated");

    const used = await swipeTracker(user.id);
    const remaining = Math.max(0, MAX_SWIPES - used);

    if (remaining === 0) {
        const resetAtISO = await swipeResetafter24(user.id);
        return { remaining: 0, resetAtISO };
    }
    return { remaining };
}

export async function recordSwipe(targetId: string, direction: "left" | "right") {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error("User not authenticated");

    // enforcing swipe limits
    const used = await swipeTracker(user.id);

    if (used >= MAX_SWIPES) {
        const resetAtISO = await swipeResetafter24(user.id);
        throw new SwipeLimitErr("Out of Swipes", { resetAtISO, remaining: 0 });
    }

    //insert swipe
    const { data, error } = await supabase
        .from("user_swipes")
        .insert([{ swiper_id: user.id, target_id: targetId, direction }])
        .select()
        .single();

    if (error) throw error;

    //returning info, optional
    const remaining = Math.max(0, MAX_SWIPES - (used + 1));
    const resetAtISO = remaining === 0 ? await swipeResetafter24(user.id) : undefined;

    return { used, remaining, resetAtISO };
    //return { data, remaining };
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
