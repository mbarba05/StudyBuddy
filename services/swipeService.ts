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
    // Extract and return array of target IDs
    return data.map((row) => row.target_id);
}
