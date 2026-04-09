import { colors } from "@/assets/colors";
import ChatRow from "@/components/features/chats/ChatRow";
import SendTextInput from "@/components/features/chats/SendTextInput";
import { CHAT_PAGE_SIZE } from "@/lib/enumFrontend";
import supabase from "@/lib/subapase";
import { formatPrettyDate } from "@/lib/utillities";
import { useAuth } from "@/services/auth/AuthProvider";
import { removeFriend, sendFriendRequest } from "@/services/friendshipsService";
import {
    Chat,
    getChatHeaderState,
    getMessagesForConv,
    LoadedAttachment,
    MessageAttachmentTable,
    MessagesTable,
} from "@/services/messageService";
import { sendPushNotification } from "@/services/PushNotifications";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSharedValue, withSpring } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type ChatRouteParams = {
    conversationId: string;
    dmName: string;
    ppPic: string;
};

type ChatListItem = { type: "message"; chat: Chat } | { type: "date"; dateKey: string };

const ConversationScreen = () => {
    const { conversationId, dmName, ppPic } = useLocalSearchParams<ChatRouteParams>();

    const tabBarHeight = useBottomTabBarHeight();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [countLeft, setCountLeft] = useState(0);
    const [headerState, setHeaderState] = useState<any>(null);
    const [busy, setBusy] = useState(false);

    const [chatsById, setChatsById] = useState<Record<string, Chat>>({});
    const [order, setOrder] = useState<string[]>([]);
    const chats = useMemo(() => order.map((id) => chatsById[id]).filter(Boolean), [order, chatsById]);
    const messagesListRef = useRef<FlatList<ChatListItem>>(null);
    const user = useAuth();

    const dateKey = (iso: string) => {
        const d = new Date(iso);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const listData: ChatListItem[] = useMemo(() => {
        const out: ChatListItem[] = [];

        for (let i = 0; i < chats.length; i++) {
            const chat = chats[i];
            out.push({ type: "message", chat });

            const cur = dateKey(chat.created_at);
            const next = chats[i + 1] ? dateKey(chats[i + 1].created_at) : null;

            if (cur !== next) {
                out.push({ type: "date", dateKey: cur });
            }
        }

        return out;
    }, [chats]);

    useEffect(() => {
        if (!order.length) return;

        const id = setTimeout(() => {
            messagesListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 0);

        return () => clearTimeout(id);
    }, [order[0]]);

    useEffect(() => {
        if (!conversationId) return;

        const loadHeader = async () => {
            try {
                const data = await getChatHeaderState(conversationId);
                setHeaderState(data);
            } catch (err) {
                console.error("loadHeader:", err);
            }
        };

        loadHeader();
    }, [conversationId]);

    useFocusEffect(
        useCallback(() => {
            let mounted = true;

            const fetchChats = async () => {
                try {
                    setLoading(true);
                    const chat = await getMessagesForConv(conversationId, 0);
                    if (mounted) {
                        const count = chat && chat.length > 0 ? chat[0].count : 0;
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
                    const newMsg = payload.new as MessagesTable;

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

                    if (newMsg.sender_id !== currentUserId) {
                        await sendPushNotification(currentUserId, `New message from ${dmName}: ${newMsg.content}`);
                    }

                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, dmName, user.user?.id]);

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
                    const newAtt = payload.new as MessageAttachmentTable;

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

                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

                    const currentUserId = user.user?.id;
                    if (!currentUserId) return;

                    if (newAtt.sender_id !== currentUserId) {
                        await sendPushNotification(currentUserId, `New message from ${dmName}: New Attachment`);
                    }
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, dmName, user.user?.id]);

    const loadOlderMessages = async () => {
        if (countLeft <= 0 || loadingMore) return;

        setLoadingMore(true);
        const offset = order.length;
        const oldChats = await getMessagesForConv(conversationId, offset);

        if (!oldChats) {
            setLoadingMore(false);
            return;
        }

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

    const handleFriendAction = async () => {
        if (!headerState || busy) return;

        try {
            setBusy(true);

            if (headerState.is_friend) {
                await removeFriend(headerState.other_user_id);
            } else {
                await sendFriendRequest(headerState.other_user_id);
            }

            const refreshed = await getChatHeaderState(conversationId);
            setHeaderState(refreshed);
        } catch (err) {
            console.error("handleFriendAction:", err);
        } finally {
            setBusy(false);
        }
    };

    const globalX = useSharedValue(0);

    const swipeLeftGesture = useMemo(() => {
        return Gesture.Pan()
            .activeOffsetX([-12, 12])
            .failOffsetY([-10, 10])
            .onUpdate((e) => {
                const nextX = Math.min(0, e.translationX);
                globalX.value = Math.max(nextX, -60);
            })
            .onEnd(() => {
                globalX.value = withSpring(0, { damping: 18, stiffness: 220, mass: 0.6 });
            });
    }, [globalX]);

    const renderItem = useCallback(
        ({ item }: { item: ChatListItem }) => {
            if (item.type === "date") {
                return (
                    <View className="items-center mt-2">
                        <Text className="text-sm text-colors-textSecondary">{formatPrettyDate(item.dateKey)}</Text>
                    </View>
                );
            }

            const chat = item.chat;
            const isOwn = chat.sender_id === user.user?.id;

            return <ChatRow item={chat} isOwn={isOwn} globalX={globalX} />;
        },
        [user.user?.id, globalX],
    );

    const header = () => (
        <View className="flex flex-row items-center justify-between w-full pr-2">
            <View className="flex flex-row items-center gap-2 flex-1">
                <Image
                    contentFit="cover"
                    source={{ uri: ppPic as string }}
                    style={{
                        width: 54,
                        height: 54,
                        borderRadius: 27,
                        borderColor: colors.textSecondary,
                        borderWidth: 1,
                    }}
                    cachePolicy="memory-disk"
                />
                <Text className="text-colors-text text-2xl font-semibold" numberOfLines={1}>
                    {dmName}
                </Text>
            </View>

            {headerState && (
                <TouchableOpacity
                    onPress={handleFriendAction}
                    disabled={busy}
                    activeOpacity={0.8}
                    className="bg-[#0A2F6B] border border-[#0E57C8] rounded-full px-4 py-2 ml-2"
                >
                    <View className="flex-row items-center gap-1">
                        <Text className="text-white text-[14px] font-semibold">
                            {headerState.is_friend ? "Remove Friend" : "Add Friend"}
                        </Text>
                        <Ionicons
                            name={headerState.is_friend ? "person-remove" : "person-add"}
                            size={18}
                            color="white"
                        />
                    </View>
                </TouchableOpacity>
            )}
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
            <GestureDetector gesture={swipeLeftGesture}>
                <SafeAreaView className="flex-1 bg-colors-background" edges={["left", "right"]}>
                    <KeyboardAvoidingView
                        className="flex-1"
                        behavior={Platform.OS === "ios" ? "padding" : undefined}
                        keyboardVerticalOffset={Platform.OS === "ios" ? tabBarHeight + insets.bottom : 0}
                    >
                        {loadingMore && <ActivityIndicator className="mt-4" />}
                        <FlatList
                            ref={messagesListRef}
                            testID="chats"
                            ItemSeparatorComponent={() => <View className="h-1" />}
                            className="flex-1"
                            contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12 }}
                            data={listData}
                            keyExtractor={(item) =>
                                item.type === "message" ? `m:${item.chat.id}` : `d:${item.dateKey}`
                            }
                            renderItem={renderItem}
                            keyboardShouldPersistTaps="handled"
                            onEndReached={loadOlderMessages}
                            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                            inverted
                        />
                        <SendTextInput convId={conversationId} canMessage={headerState?.is_friend ?? true} />
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </GestureDetector>
        </>
    );
};

export default ConversationScreen;

