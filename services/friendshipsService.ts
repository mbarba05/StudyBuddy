import { FUNCTIONS, TABLES } from "@/lib/enumBackend";
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

// Accept incoming friend request
export async function acceptFriendRequest(request: FriendRequest) {
    console.log("Req", request.id);

    // Update request to "accepted"
    const { error: updateErr } = await supabase
        .from(TABLES.FRIEND_REQUESTS)
        .update({ status: "accepted" })
        .eq("id", request.id);

    if (updateErr) throw updateErr;

    // Insert mutual friendship entries
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

// Reject friend request
export async function rejectFriendRequest(request_id: number) {
    const { error } = await supabase.from(TABLES.FRIEND_REQUESTS).update({ status: "rejected" }).eq("id", request_id);

    if (error) throw error;
}

// Removes friends but needss to be checked on mobile
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

    if (error) {
        console.error("removeFriend:", error);
        return error;
    }

    return true;
}

// Checks if two different users are friends already
export async function areFriends(user_id: string, friend_id: string) {
    const { data, error } = await supabase
        .from(TABLES.FRIENDSHIPS)
        .select("id")
        .or(`and(user_id.eq.${user_id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user_id})`)
        .maybeSingle();

    if (error) {
        console.error("areFriends", error);
    }
    return !!data;
}

// Friends count for the profile screen
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

// Get all friends
export async function getAllFriends() {
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
        major: major_id (name),
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

    return data.map((row) => {
        // if I am user_id → friend is friendProfile
        const isUserSender = row.user_id === user.id;
        const profile: any = isUserSender ? row.friendProfile : row.userProfile;

        return {
            friend_id: profile.user_id,
            full_name: profile.display_name,
            avatar_url: profile.pp_url,
            major: profile.major.name,
            year: profile.year,
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

    const { data: areFriends, error: friendsError } = await supabase.rpc(FUNCTIONS.ARE_FRIENDS, {
        p_curr_user_id: user.id,
        p_user_id: userId,
    });

    if (friendsError) {
        console.error("checkStatus, are checking if friends", friendsError);
        return FriendshipStatus.error;
    }

    console.log("ARE FRINED", areFriends);

    if (areFriends[0].friends) return FriendshipStatus.friends;

    const { data: reqData, error } = await supabase.rpc(FUNCTIONS.CHECK_PENDING_REQUEST, {
        p_curr_user_id: user.id,
        p_user_id: userId,
    });

    if (error) {
        console.error("checkStatus, error finding pending friend request", error);
        return FriendshipStatus.error;
    }
    console.log("REQ DATA", reqData);
    if (reqData.length > 0) {
        if (reqData[0].sender_id == user.id) return FriendshipStatus.pendingSent; // curr user sent a request that is pending

        if (reqData[0].sender_id == userId) return FriendshipStatus.pendingAccept; // curr user has received a request from the user they are viewing
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

    const res = { count: 0, friends: [] };

    if (authError || !user) {
        console.error("mutualFriends, ", authError);
        return res;
    }

    console.log("USERID: ", user.id);
    console.log("OTHERUSERID: ", otherUserId);

    const { data, error } = await supabase.rpc(FUNCTIONS.MUTUAL_FRIENDS, {
        p_user_id: user.id,
        p_other_user_id: otherUserId,
    });

    console.log("FRIENDS", data);

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
