import { TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/subapase";
import { createConversation } from "./messageService";

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

export type FriendListItem = {
    friend_id: string;
    full_name: string;
    avatar_url: string | null;
    major: string | null;
    year: string | null;
    interactionCount?: number;
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
        .insert({ sender_id: user.id, receiver_id, status: "pending" })
        .select()
        .single();

    if (error) throw error;
    return data as FriendRequest;
}

export async function getIncomingFriendRequests() {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error("User not authenticated");

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
        pp_url,
        year,
        major:major_id(name)
      )
    `,
        )
        .eq("receiver_id", user.id)
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
    `,
        )
        .eq("sender_id", user_id)
        .eq("status", "pending");

    if (error) throw error;
    return data as FriendRequest[];
}

export async function acceptFriendRequest(request: FriendRequest) {
    const { error: updateErr } = await supabase
        .from(TABLES.FRIEND_REQUESTS)
        .update({ status: "accepted" })
        .eq("id", request.id);

    if (updateErr) throw updateErr;

    const { error: insertErr } = await supabase.from(TABLES.FRIENDSHIPS).insert([
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

    await createConversation(request.sender_id, request.receiver_id);
}

export async function rejectFriendRequest(request_id: number) {
    const { error } = await supabase
        .from(TABLES.FRIEND_REQUESTS)
        .update({ status: "rejected" })
        .eq("id", request_id);

    if (error) throw error;
}

export async function removeFriend(friend_id: string) {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
        .from(TABLES.FRIENDSHIPS)
        .delete()
        .or(
            `and(user_id.eq.${user.id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user.id})`,
        );

    if (error) throw error;
}

export async function areFriends(user_id: string, friend_id: string) {
    const { data, error } = await supabase
        .from(TABLES.FRIENDSHIPS)
        .select("id")
        .or(`and(user_id.eq.${user_id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user_id})`)
        .maybeSingle();

    if (error) throw error;
    return !!data;
}

export async function getFriendsCount() {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error("User not authenticated");

    const { count, error } = await supabase
        .from(TABLES.FRIENDSHIPS)
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "accepted");

    if (error) {
        console.error("getFriendsCount error:", error);
        return 0;
    }

    return count || 0;
}

export async function getAllFriends(): Promise<FriendListItem[]> {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
        .from(TABLES.FRIENDSHIPS)
        .select(
            `
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
        major:major_id(name),
        year
      )
    `,
        )
        .or(`user_id.eq.${user.id}`)
        .eq("status", "accepted");

    if (error) {
        console.error("getAllFriends error:", error);
        return [];
    }

    return (data ?? []).map((row: any) => {
        const isUserSender = row.user_id === user.id;
        const profile: any = isUserSender ? row.friendProfile : row.userProfile;

        return {
            friend_id: profile?.user_id,
            full_name: profile?.display_name ?? "Unknown User",
            avatar_url: profile?.pp_url ?? null,
            major: profile?.major?.name ?? null,
            year: profile?.year ?? null,
        };
    });
}

export async function getFriendsByInteraction(mode: "most" | "least"): Promise<FriendListItem[]> {
    const friends = await getAllFriends();
    if (friends.length === 0) return [];

    const { data, error } = await supabase.rpc("get_friend_interaction_counts");

    if (error) {
        console.error("getFriendsByInteraction rpc error:", error);
        return friends;
    }

    const counts: Record<string, number> = {};

    friends.forEach((friend) => {
        counts[friend.friend_id] = 0;
    });

    (data ?? []).forEach((row: any) => {
        if (row.friend_id) {
            counts[row.friend_id] = Number(row.interaction_count ?? 0);
        }
    });

    const merged = friends.map((friend) => ({
        ...friend,
        interactionCount: counts[friend.friend_id] || 0,
    }));

    merged.sort((a, b) => {
        const aCount = a.interactionCount || 0;
        const bCount = b.interactionCount || 0;

        if (mode === "most") {
            if (bCount !== aCount) return bCount - aCount;
            return a.full_name.localeCompare(b.full_name);
        }

        if (aCount !== bCount) return aCount - bCount;
        return a.full_name.localeCompare(b.full_name);
    });

    return merged;
}
