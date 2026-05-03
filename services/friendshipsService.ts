import { FUNCTIONS, TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/supabase";
import { createConversation } from "./messageService";

export type FriendStatus = "pending" | "accepted" | "rejected";

export type Friendship = {
    id: number;
    created_at: string;
    user_id: string;
    friend_id: string;
    status: FriendStatus;
};

export interface PendingFriendRequest {
    id: number;
    created_at: string;
    sender_id: string;
    receiver_id: string;
    status: string;
    display_name: string;
    pp_url: string | null;
    year: string | null;
    bio: string | null;
    photo_urls: string[] | null;
    major_name: string | null;
}

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
    return data as PendingFriendRequest;
}

export async function getIncomingFriendRequests(): Promise<PendingFriendRequest[]> {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase.rpc(FUNCTIONS.GET_PENDING_FRIEND_REQUESTS, { p_user_id: user.id });
    if (error) {
        console.error("getIncomingFriendRequests: ", error);
    }

    return data;
}

export async function acceptFriendRequest(req_id: number, sender_id: string, reciever_id: string) {
    const { error: updateErr } = await supabase
        .from(TABLES.FRIEND_REQUESTS)
        .update({ status: "accepted" })
        .eq("id", req_id);

    if (updateErr) throw updateErr;

    const { error: insertErr } = await supabase.from(TABLES.FRIENDSHIPS).insert([
        {
            user_id: sender_id,
            friend_id: reciever_id,
            status: "accepted",
        },
        {
            user_id: reciever_id,
            friend_id: sender_id,
            status: "accepted",
        },
    ]);

    if (insertErr) throw insertErr;

    await createConversation(sender_id, reciever_id);
}

export async function rejectFriendRequest(request_id: number) {
    const { error } = await supabase.from(TABLES.FRIEND_REQUESTS).update({ status: "rejected" }).eq("id", request_id);

    if (error) throw error;
}

export async function removeFriend(friend_id: string) {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error("User not authenticated");

    const { error: friendshipError } = await supabase
        .from(TABLES.FRIENDSHIPS)
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user.id})`)
        .eq("status", "accepted");

    if (friendshipError) {
        console.error("removeFriend friendshipError:", friendshipError);
        return friendshipError;
    }

    const { error: requestError } = await supabase
        .from(TABLES.FRIEND_REQUESTS)
        .delete()
        .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${friend_id}),and(sender_id.eq.${friend_id},receiver_id.eq.${user.id})`,
        )
        .eq("status", "pending");

    if (requestError) {
        console.error("removeFriend requestError:", requestError);
        return requestError;
    }

    return true;
}

export async function areFriends(user_id: string, friend_id: string) {
    const { count, error } = await supabase
        .from(TABLES.FRIENDSHIPS)
        .select("*", { count: "exact", head: true })
        .or(`and(user_id.eq.${user_id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user_id})`)
        .eq("status", "accepted");

    if (error) {
        console.error("areFriends", error);
        return false;
    }

    return (count ?? 0) > 0;
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

export enum FriendshipStatus {
    none,
    friends,
    self,
    pendingSent,
    pendingAccept,
    error,
}

export const checkStatus = async (userId: string): Promise<FriendshipStatus> => {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error("User not authenticated");
        return FriendshipStatus.error;
    }

    if (userId == user.id) return FriendshipStatus.self;

    const { data: areFriendsData, error: friendsError } = await supabase.rpc(FUNCTIONS.ARE_FRIENDS, {
        p_curr_user_id: user.id,
        p_user_id: userId,
    });

    if (friendsError) {
        console.error("checkStatus, checking if friends", friendsError);
        return FriendshipStatus.error;
    }

    if (areFriendsData?.[0]?.friends) return FriendshipStatus.friends;

    const { data: reqData, error } = await supabase.rpc(FUNCTIONS.CHECK_PENDING_REQUEST, {
        p_curr_user_id: user.id,
        p_user_id: userId,
    });

    if (error) {
        console.error("checkStatus, error finding pending friend request", error);
        return FriendshipStatus.error;
    }

    if (reqData.length > 0) {
        if (reqData[0].sender_id == user.id) return FriendshipStatus.pendingSent;
        if (reqData[0].sender_id == userId) return FriendshipStatus.pendingAccept;
    }

    return FriendshipStatus.none;
};

export interface MutualFriends {
    count: number;
    friends: {
        display_name: string;
        friend_id: string;
    }[];
}

export const mutualFriends = async (otherUserId: string): Promise<MutualFriends> => {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    const res = { count: 0, friends: [] as { display_name: string; friend_id: string }[] };

    if (authError || !user) {
        console.error("mutualFriends, ", authError);
        return res;
    }

    const { data, error } = await supabase.rpc(FUNCTIONS.MUTUAL_FRIENDS, {
        p_user_id: user.id,
        p_other_user_id: otherUserId,
    });

    if (error) {
        console.error("mutualFriends rpc error:", error);
        return res;
    }

    if (data) {
        res.count = data.length;
        res.friends = data;
    }

    return res;
};

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
