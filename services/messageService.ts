import { TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/subapase";

export type DMConversation = {
    conversation_id: string;
    other_user_id: string;
    dm_name: string;
    pp_url: string;
    type: "dm";
    last_message: string | null;
    last_message_at: string | null;
};

export async function createConversation(userA: string, userB: string) {
    const { data, error } = await supabase
        .from(TABLES.CONVERSATIONS)
        .insert({ type: "dm", created_by: userA })
        .select("id")
        .single();

    if (error || data == null) {
        console.error("Error making conversation:", error);
        return;
    }

    const conversationId = data.id;

    const { data: membData, error: membError } = await supabase.from(TABLES.CONVERSATION_MEMBERS).insert([
        { conversation_id: conversationId, user_id: userA },
        { conversation_id: conversationId, user_id: userB },
    ]);

    if (membError) {
        console.error("Error making conversation members:", membError);
        return;
    }

    return membData;
}

export async function getChatsWithRecentMessage(): Promise<DMConversation[] | null> {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error("User not authenticated");
    console.log(user.id);
    const { data, error } = await supabase.rpc("get_dms_for_user", { p_user_id: user.id });

    if (error) {
        console.error("Error getting dms for user", error);
        return null;
    }
    console.log(data);
    return data;
}

export async function sendMessage() {}
