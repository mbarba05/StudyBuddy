import { BUCKETS, TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/subapase";
import { DocumentPickerAsset } from "expo-document-picker";
import { ImagePickerAsset } from "expo-image-picker";

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
    //this is what is returned from the supabase function in getMessagesForConv
    id: string;
    content: string | null;
    sender_id: string;
    created_at: string;
    conversation_id: string;
    count: number;
    attachments: LoadedAttachment[];
};

export type LoadedAttachment = {
    //also from supabase rpc
    id: string;
    path: string;
    mime_type: string;
    created_at: string;
};

export type MessageAttachmentTable = {
    id: string;
    conversation_id: string;
    sender_id: string;
    message_id: string;
    path: string;
    mime_type: string;
    created_at: string;
};

export type MessagesTable = {
    id: string;
    conversation_id: string;
    sender_id: string;
    created_at: string;
    content: string;
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
    //console.log("MESSAGES", data);
    return data;
}

export async function sendMessage(clientId: string, message: string, convId: string, uris: ChatAttachment[]) {
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
        .select("id")
        .single();

    if (error) {
        console.error("Error sending text", error);
        return error;
    }

    createAttachment(uris, convId, data.id);
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

export type ChatAttachment = ImagePickerAsset | DocumentPickerAsset;

export async function createAttachment(uris: ChatAttachment[], convId: string, messageId: string) {
    const { data, error: authError } = await supabase.auth.getUser();
    const user = data?.user;

    if (authError || !user) {
        throw authError ?? new Error("No user");
    }

    // Upload all, then insert all
    const uploaded = await Promise.all(uris.map((u) => uploadAttachmentToStorage(u, convId)));

    const rows = uploaded.map((u) => ({
        conversation_id: convId,
        sender_id: user.id,
        message_id: messageId,
        path: u.path,
        mime_type: u.mime,
    }));

    const { error } = await supabase.from(TABLES.MESSAGE_ATTACHMENTS).insert(rows);

    if (error) throw error;

    return rows;
}

function getExt(name?: string, mime?: string): string {
    return name?.split(".").pop()?.toLowerCase() || mime?.split("/")[1]?.toLowerCase() || "png";
}

export function isImagePickerAsset(a: ChatAttachment): a is ImagePickerAsset {
    return typeof (a as any).width === "number" && typeof (a as any).height === "number";
}

export function isDocumentPickerAsset(a: ChatAttachment): a is DocumentPickerAsset {
    return typeof (a as any).name === "string";
}

export function isImageMime(mime?: string) {
    return !!mime && (mime.startsWith("image") || mime?.includes("live"));
}

export function fileNameFromPath(path: string) {
    return path.split("/").pop() ?? "file";
}

export async function uploadAttachmentToStorage(
    file: ChatAttachment,
    convId: string,
): Promise<{ path: string; mime: string; name?: string }> {
    let name: string | undefined;
    let mime: string | undefined;
    let body: Uint8Array;

    if (isDocumentPickerAsset(file)) {
        name = file.name;
        mime = file.mimeType ?? undefined;

        const resp = await fetch(file.uri);
        const arrayBuffer = await resp.arrayBuffer();
        body = new Uint8Array(arrayBuffer);
    } else if (isImagePickerAsset(file)) {
        name = file.fileName ?? undefined;
        mime = file.mimeType ?? undefined;

        const resp = await fetch(file.uri);
        const arrayBuffer = await resp.arrayBuffer();
        body = new Uint8Array(arrayBuffer);
    } else {
        throw new Error("Unknown attachment type");
    }

    if (body.byteLength === 0) {
        throw new Error(`0-byte upload from uri=${file.uri}`);
    }

    if (!mime) mime = "application/octet-stream";

    const ext = getExt(name, mime);
    const filePath = `conversations/${convId}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
        .from(BUCKETS.ATTACHMENTS)
        .upload(filePath, body, { upsert: false, contentType: mime });

    if (uploadError) throw uploadError;

    return { path: filePath, mime, name };
}

//ATTACHMENTS will be stored in a private bucket, so we need to create a signed url (a url with a token that expires)
//then use cache and use that url to display images

export async function getAttachmentSignedUrl(path: string, expiresInSeconds = 60 * 30) {
    const { data, error } = await supabase.storage.from(BUCKETS.ATTACHMENTS).createSignedUrl(path, expiresInSeconds);

    if (error) throw error;
    if (!data?.signedUrl) throw new Error("No signedUrl returned");

    return data.signedUrl;
}
