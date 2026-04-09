import { BUCKETS, TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/subapase";
import { DocumentPickerAsset } from "expo-document-picker";
import { ImagePickerAsset } from "expo-image-picker";
import { Image } from "react-native";

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
    content: string | null;
    sender_id: string;
    created_at: string;
    conversation_id: string;
    count: number;
    attachments: LoadedAttachment[];
};

export type LoadedAttachment = {
    id: string;
    path: string;
    mime_type: string;
    created_at: string;
    aspect_ratio: number;
};

export type MessageAttachmentTable = {
    id: string;
    conversation_id: string;
    sender_id: string;
    message_id: string;
    path: string;
    mime_type: string;
    created_at: string;
    aspect_ratio: number;
};

export type MessagesTable = {
    id: string;
    conversation_id: string;
    sender_id: string;
    created_at: string;
    content: string;
};

export type ChatHeaderState = {
    conversation_id: string;
    other_user_id: string;
    dm_name: string;
    pp_url: string | null;
    is_friend: boolean;
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

    const { error: membError } = await supabase.from(TABLES.CONVERSATION_MEMBERS).insert([
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
    });

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

async function getCurrentUserId(): Promise<string> {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error("User not authenticated");

    return user.id;
}

async function getOtherUserIdForConversation(convId: string, currentUserId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from(TABLES.CONVERSATION_MEMBERS)
        .select("user_id")
        .eq("conversation_id", convId);

    if (error) {
        console.error("getOtherUserIdForConversation:", error);
        return null;
    }

    const otherMember = (data ?? []).find((row: any) => row.user_id !== currentUserId);
    return otherMember?.user_id ?? null;
}

async function areUsersStillFriends(userA: string, userB: string): Promise<boolean> {
    const { count, error } = await supabase
        .from(TABLES.FRIENDSHIPS)
        .select("*", { count: "exact", head: true })
        .or(`and(user_id.eq.${userA},friend_id.eq.${userB}),and(user_id.eq.${userB},friend_id.eq.${userA})`)
        .eq("status", "accepted");

    if (error) {
        console.error("areUsersStillFriends:", error);
        return false;
    }

    return (count ?? 0) > 0;
}

export async function getChatHeaderState(convId: string): Promise<ChatHeaderState | null> {
    const currentUserId = await getCurrentUserId();
    const otherUserId = await getOtherUserIdForConversation(convId, currentUserId);

    if (!otherUserId) return null;

    const { data: profile, error: profileError } = await supabase
        .from(TABLES.PROFILES)
        .select("user_id, display_name, pp_url")
        .eq("user_id", otherUserId)
        .single();

    if (profileError) {
        console.error("getChatHeaderState profileError:", profileError);
        return null;
    }

    const isFriend = await areUsersStillFriends(currentUserId, otherUserId);

    return {
        conversation_id: convId,
        other_user_id: otherUserId,
        dm_name: profile.display_name,
        pp_url: profile.pp_url ?? null,
        is_friend: isFriend,
    };
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

    const otherUserId = await getOtherUserIdForConversation(convId, user.id);
    if (!otherUserId) {
        return new Error("Could not find the other user for this conversation.");
    }

    const stillFriends = await areUsersStillFriends(user.id, otherUserId);
    if (!stillFriends) {
        return new Error("You can no longer message this user unless you become friends again.");
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

    if (uris.length > 0) {
        await createAttachment(uris, convId, data.id);
    }
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
    if (authError || !user) throw authError ?? new Error("No user");

    const aspectRatios = await Promise.all(
        uris.map(async (a) => {
            if (!isImageMime((a as any).mimeType ?? (a as any).mime)) return null;

            if (isImagePickerAsset(a) && a.width > 0 && a.height > 0) {
                return a.width / a.height;
            }

            const localUri = (a as any).uri ?? (a as any).localUri ?? (a as any).file ?? null;
            if (!localUri) return null;

            try {
                return await getImageAspectRatio(localUri);
            } catch {
                return null;
            }
        }),
    );

    const uploaded = await Promise.all(uris.map((u) => uploadAttachmentToStorage(u, convId)));

    const rows = uploaded.map((u, idx) => ({
        conversation_id: convId,
        sender_id: user.id,
        message_id: messageId,
        path: u.path,
        mime_type: u.mime,
        aspect_ratio: aspectRatios[idx],
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
    const fullName = path.split("/").pop() ?? "file";
    const parts = fullName.split("-");
    return parts.length > 2 ? parts.slice(2).join("-") : fullName;
}

export async function getImageAspectRatio(uri: string): Promise<number> {
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject);
    });

    return width / height;
}

function sanitizeFileName(name: string) {
    return name
        .normalize("NFKD")
        .replace(/[^\w.\-]/g, "_")
        .replace(/_+/g, "_")
        .toLowerCase();
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
    const safeName = sanitizeFileName(name ?? `file.${ext}`);
    const uniquePrefix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const filePath = `conversations/${convId}/${uniquePrefix}-${safeName}`;

    const { error: uploadError } = await supabase.storage
        .from(BUCKETS.ATTACHMENTS)
        .upload(filePath, body, { upsert: false, contentType: mime });

    if (uploadError) throw uploadError;

    return { path: filePath, mime, name };
}

type SignedUrlCacheEntry = { signedUrl: string; expiresAtMs: number };

const signedUrlCache = new Map<string, SignedUrlCacheEntry>();
const inflight = new Map<string, Promise<string>>();
const SKEW_MS = 60_000;

export async function getAttachmentSignedUrlCached(path: string, expiresInSeconds = 60 * 30) {
    const now = Date.now();

    const cached = signedUrlCache.get(path);
    if (cached && cached.expiresAtMs - SKEW_MS > now) return cached.signedUrl;

    const pending = inflight.get(path);
    if (pending) return pending;

    const p = (async () => {
        try {
            const { data, error } = await supabase.storage
                .from(BUCKETS.ATTACHMENTS)
                .createSignedUrl(path, expiresInSeconds);

            if (error) throw error;
            if (!data?.signedUrl) throw new Error("No signedUrl returned");

            signedUrlCache.set(path, {
                signedUrl: data.signedUrl,
                expiresAtMs: now + expiresInSeconds * 1000,
            });

            return data.signedUrl;
        } finally {
            inflight.delete(path);
        }
    })();

    inflight.set(path, p);
    return p;
}
