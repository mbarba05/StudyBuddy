import supabase from "@/lib/supabase";

export type UserBlock = {
    id: number;
    created_at: string;
    blocker_id: string;
    blocked_id: string;
};

export type BlockStatus = {
    i_blocked: boolean;
    blocked_me: boolean;
    any_block: boolean;
};

async function getCurrentUserId(): Promise<string> {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error) throw error;
    if (!user) throw new Error("User not authenticated");

    return user.id;
}

export async function blockUser(blockedUserId: string): Promise<UserBlock> {
    const currentUserId = await getCurrentUserId();

    if (currentUserId === blockedUserId) {
        throw new Error("You cannot block yourself");
    }

    const { data, error } = await supabase
        .from("user_blocks")
        .upsert(
            {
                blocker_id: currentUserId,
                blocked_id: blockedUserId,
            },
            { onConflict: "blocker_id,blocked_id" },
        )
        .select()
        .single();

    if (error) throw error;
    return data as UserBlock;
}

export async function unblockUser(blockedUserId: string): Promise<void> {
    const currentUserId = await getCurrentUserId();

    const { error } = await supabase
        .from("user_blocks")
        .delete()
        .eq("blocker_id", currentUserId)
        .eq("blocked_id", blockedUserId);

    if (error) throw error;
}

export async function getBlockStatus(targetUserId: string): Promise<BlockStatus> {
    const currentUserId = await getCurrentUserId();

    const { data, error } = await supabase
        .from("user_blocks")
        .select("blocker_id, blocked_id")
        .or(
            `and(blocker_id.eq.${currentUserId},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${currentUserId})`,
        );

    if (error) throw error;

    const rows = data ?? [];

    const i_blocked = rows.some((r: any) => r.blocker_id === currentUserId && r.blocked_id === targetUserId);
    const blocked_me = rows.some((r: any) => r.blocker_id === targetUserId && r.blocked_id === currentUserId);

    return {
        i_blocked,
        blocked_me,
        any_block: i_blocked || blocked_me,
    };
}

export async function hasBlockedUser(blockedUserId: string): Promise<boolean> {
    const status = await getBlockStatus(blockedUserId);
    return status.i_blocked;
}

export async function isBlockedByOrHasBlocked(targetUserId: string): Promise<boolean> {
    const status = await getBlockStatus(targetUserId);
    return status.any_block;
}

export async function getAllBlockedRelationUserIds(): Promise<string[]> {
    const currentUserId = await getCurrentUserId();

    const [{ data: blockedByMe, error: err1 }, { data: blockedMe, error: err2 }] = await Promise.all([
        supabase.from("user_blocks").select("blocked_id").eq("blocker_id", currentUserId),
        supabase.from("user_blocks").select("blocker_id").eq("blocked_id", currentUserId),
    ]);

    if (err1) throw err1;
    if (err2) throw err2;

    return Array.from(
        new Set([
            ...(blockedByMe ?? []).map((r: any) => r.blocked_id),
            ...(blockedMe ?? []).map((r: any) => r.blocker_id),
        ]),
    );
}
