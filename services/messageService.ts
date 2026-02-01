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
    last_message_id: string | null;
    read: boolean;
};

export type Chat = {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    conversation_id: string;
    count: number;
};

export async function createConversation(userA: string, userB: string) {
    const { data, error } = await supabase //create conversation
        .from(TABLES.CONVERSATIONS)
        .insert({ type: "dm", created_by: userA })
        .select("id")
        .single();

    if (error || data == null) {
        console.error("Error making conversation:", error);
        return;
    }

    const conversationId = data.id;

    const { error: membError } = await supabase.from(TABLES.CONVERSATION_MEMBERS).insert([
        // create conversation members
        { conversation_id: conversationId, user_id: userA },
        { conversation_id: conversationId, user_id: userB },
    ]);

    if (membError) {
        console.error("Error making conversation members:", membError);
        return;
    }

    const { error: chatError } = await supabase.from(TABLES.MESSAGES).insert({
        conversation_id: conversationId,
        content: "I accepted your request",
        sender_id: userB,
    }); //send message

    if (chatError) {
        console.error("Error sending chat:", chatError);
        return;
    }
}

export async function getChatsWithRecentMessage(): Promise<DMConversation[] | null> {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error("User not authenticated");
    const { data, error } = await supabase.rpc("get_dms_for_user", {
        p_user_id: user.id,
    });

    if (error) {
        console.error("Error getting dms for user", error);
        return null;
    }
    return data;
}

export async function getMessagesForConv(convId: string, offset: number): Promise<Chat[] | null> {
    const { data, error } = await supabase.rpc("get_dms_for_conversation", {
        p_conv_id: convId,
        offst: offset,
    });
    if (error) {
        console.error("Error getting dms for conversation", error);
        return null;
    }
    return data;
}

export async function sendMessage(clientId: string, message: string, convId: string) {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error("Auth error when sending text", authError);
        return authError;
    }

    const { data, error } = await supabase
        .from(TABLES.MESSAGES)
        .insert({
            id: clientId,
            content: message,
            sender_id: user.id,
            conversation_id: convId,
        })
        .select("id, created_at")
        .single();

    if (error) {
        console.error("Error sending text", error);
        return error;
    }
    //updateReadMessage(data.id, convId); //mark the sent message as read so its not highlighted in the inboxs
    //trigger then updates last message
}

export async function updateReadMessage(messageId: string | null, convId: string) {
    if (!messageId) return;
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error("Auth error when updating read", authError);
        return authError;
    }

    const { error } = await supabase
        .from(TABLES.CONVERSATION_MEMBERS)
        .update({ last_read_message_id: messageId })
        .eq("user_id", user.id)
        .eq("conversation_id", convId);

    if (error) {
        console.error("Error when updating read", error);
        return error;
    }
}
