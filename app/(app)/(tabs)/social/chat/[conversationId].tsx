import { colors } from "@/assets/colors";
import AttachmentImages from "@/components/features/chats/AttachmentImage";
import ChatBubble from "@/components/features/chats/ChatBubble";
import SendTextInput from "@/components/features/chats/SendTextInput";
import { CHAT_PAGE_SIZE } from "@/lib/enumFrontend";
import supabase from "@/lib/subapase";
import { useAuth } from "@/services/auth/AuthProvider";
import {
    Chat,
    getMessagesForConv,
    LoadedAttachment,
    MessageAttachmentTable,
    MessagesTable,
} from "@/services/messageService";
import { sendPushNotification } from "@/services/PushNotifications";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type ChatRouteParams = {
    conversationId: string;
    dmName: string;
    ppPic: string;
};

const ConversationScreen = () => {
    const { conversationId, dmName, ppPic } = useLocalSearchParams<ChatRouteParams>();

    const tabBarHeight = useBottomTabBarHeight();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [countLeft, setCountLeft] = useState(0);

    //we need to store chats as a record because of the way we subsrcibe to them on supabase
    //messages and attachments are 2 diff tables, so we need to make 2 realitime subscriptions and
    //merge the attachments into the messages seperatley
    const [chatsById, setChatsById] = useState<Record<string, Chat>>({});
    const [order, setOrder] = useState<string[]>([]);
    const chats = useMemo(() => order.map((id) => chatsById[id]).filter(Boolean), [order, chatsById]);

    const user = useAuth();

    useFocusEffect(
        useCallback(() => {
            let mounted = true;

            const fetchChats = async () => {
                try {
                    setLoading(true);
                    const chat = await getMessagesForConv(conversationId, 0);
                    if (mounted) {
                        const count = chat && chat?.length > 0 ? chat[0].count : 0;
                        if (count > CHAT_PAGE_SIZE) setCountLeft(count - CHAT_PAGE_SIZE);
                        if (!chat) return;
                        const nextById: Record<string, Chat> = {};
                        const nextOrder: string[] = [];

                        for (const c of chat) {
                            nextById[c.id] = c;
                            nextOrder.push(c.id);
                        }

                        setChatsById(nextById);
                        setOrder(nextOrder);
                    }
                } finally {
                    if (mounted) setLoading(false);
                }
            };
            fetchChats();

            // cleanup when screen loses focus
            return () => {
                mounted = false;
            };
        }, [conversationId]),
    );

    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${conversationId}`,
                },
                async (payload) => {
                    let newMsg = payload.new as MessagesTable;
                    setChatsById((prev) => {
                        if (prev[newMsg.id]) return prev;

                        const newChat: Chat = {
                            attachments: [],
                            content: newMsg.content,
                            conversation_id: newMsg.conversation_id,
                            created_at: newMsg.created_at,
                            id: newMsg.id,
                            sender_id: newMsg.sender_id,
                            count: 0,
                        };
                        return { ...prev, [newMsg.id]: newChat };
                    });

                    setOrder((prev) => {
                        if (prev[0] === newMsg.id) return prev;
                        if (prev.includes(newMsg.id)) return prev;
                        return [newMsg.id, ...prev];
                    });

                    const currentUserId = user.user?.id;

                    if (!currentUserId) return;

                    //Notify the user if they receive a new message from the other person in the DM
                    if (newMsg.sender_id !== currentUserId) {
                        await sendPushNotification(currentUserId, `New message from ${dmName}: ${newMsg.content}`);
                    }

                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); //vibration
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`message_attachments:${conversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "message_attachments",
                    filter: `conversation_id=eq.${conversationId}`,
                },
                async (payload) => {
                    let newAtt = payload.new as MessageAttachmentTable;

                    setChatsById((prev) => {
                        const msg = prev[newAtt.message_id];
                        if (!msg) return prev;

                        const existing = msg.attachments ?? [];
                        if (existing.some((x) => x.id === newAtt.id)) return prev;

                        const loaded: LoadedAttachment = {
                            id: newAtt.id,
                            path: newAtt.path,
                            mime_type: newAtt.mime_type,
                            created_at: newAtt.created_at,
                            aspect_ratio: newAtt.aspect_ratio,
                        };

                        return {
                            ...prev,
                            [newAtt.message_id]: {
                                ...msg,
                                attachments: [...existing, loaded],
                            },
                        };
                    });

                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); //vibration

                    const currentUserId = user.user?.id;

                    if (!currentUserId) return;

                    //Notify the user if they receive a new message from the other person in the DM
                    if (newAtt.sender_id !== currentUserId) {
                        await sendPushNotification(currentUserId, `New message from ${dmName}: New Attachment`);
                    }
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    const loadOlderMessages = async () => {
        if (countLeft <= 0 || loadingMore) return;
        setLoadingMore(true);
        const offset = order.length;
        const oldChats = await getMessagesForConv(conversationId, offset);
        if (!oldChats) return;
        const nextById: Record<string, Chat> = {};
        const nextOrder: string[] = [];

        for (const c of oldChats) {
            nextById[c.id] = c;
            nextOrder.push(c.id);
        }

        setChatsById((prev) => ({ ...prev, ...nextById }));
        setOrder((prev) => [...prev, ...nextOrder]);

        setCountLeft((prev) => prev - CHAT_PAGE_SIZE);
        setLoadingMore(false);
    };

    const renderItem = useCallback(
        ({ item }: { item: Chat }) => {
            const isOwn = item.sender_id === user.user?.id;
            return (
                <View className={`flex flex-col mb-2 ${isOwn ? "items-end" : "items-start"}`}>
                    {item.attachments?.length > 0 && <AttachmentImages attachments={item.attachments} />}
                    {item.content && <ChatBubble isOwn={isOwn}>{item.content}</ChatBubble>}
                </View>
            );
        },
        [user.user?.id],
    );

    const header = () => (
        <View className="flex flex-row items-center gap-2">
            <Image source={{ uri: ppPic }} className="w-12 h-12 rounded-full" />
            <Text className="text-colors-text text-2xl font-semibold">{dmName}</Text>
        </View>
    );

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: header,
                    headerStyle: { backgroundColor: colors.background },
                }}
            />
            <SafeAreaView className="flex-1 bg-colors-background" edges={["left", "right"]}>
                <KeyboardAvoidingView
                    className="flex-1"
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    keyboardVerticalOffset={Platform.OS === "ios" ? tabBarHeight + insets.bottom : 0}
                >
                    {loadingMore && <ActivityIndicator className="mt-4" />}
                    <FlatList
                        testID="chats"
                        className="flex-1"
                        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12 }}
                        data={chats}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        inverted
                        keyboardShouldPersistTaps="handled"
                        onEndReached={loadOlderMessages}
                        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                    />
                    <SendTextInput setChatsById={setChatsById} setOrder={setOrder} convId={conversationId} />
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
};

export default ConversationScreen;
