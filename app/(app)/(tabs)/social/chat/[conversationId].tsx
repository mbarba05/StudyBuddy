import { colors } from "@/assets/colors";
import ChatBubble from "@/components/features/chats/ChatBubble";
import SendTextInput from "@/components/features/chats/SendTextInput";
import { CHAT_PAGE_SIZE } from "@/lib/enumFrontend";
import supabase from "@/lib/subapase";
import { useAuth } from "@/services/auth/AuthProvider";
import { Chat, getMessagesForConv } from "@/services/messageService";
import { sendPushNotification } from "@/services/PushNotifications";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type ChatRouteParams = {
    conversationId: string;
    dmName: string;
    ppPic: string;
};

//TODO: fetch rest of the conversation when scrolling up

const ConversationScreen = () => {
    const { conversationId, dmName, ppPic } = useLocalSearchParams<ChatRouteParams>();

    const tabBarHeight = useBottomTabBarHeight();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [countLeft, setCountLeft] = useState(0);
    const [chats, setChats] = useState<Chat[]>([]);
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
                        setChats(chat as Chat[]);
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
                    const newMsg = payload.new as Chat;
                    setChats((prev) => {
                        if (prev.some((m) => m.id === newMsg.id)) return prev;
                        return [newMsg, ...prev];
                    });
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

                    const currentUserId = user.user?.id;

                    if (!currentUserId) return;

                    //Notify the user if they receive a new message from the other person in the DM
                    if (newMsg.sender_id !== currentUserId) {
                        await sendPushNotification(currentUserId, `New message from ${dmName}: ${newMsg.content}`);
                    }
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, user.user?.id, dmName]);

    const loadOlderMessages = async () => {
        if (countLeft <= 0 || loadingMore) return;
        setLoadingMore(true);
        const offset = chats ? chats.length : 0;
        const oldChats = await getMessagesForConv(conversationId, offset);
        if (!oldChats) return;
        setChats((prev) => [...prev, ...oldChats]);
        setCountLeft((prev) => prev - CHAT_PAGE_SIZE);
        setLoadingMore(false);
    };

    const renderItem = useCallback(
        ({ item }: { item: Chat }) => {
            const isOwn = item.sender_id === user.user?.id;
            return (
                <View className={`mb-2 ${isOwn ? "items-end" : "items-start"}`}>
                    <ChatBubble isOwn={isOwn}>{item.content}</ChatBubble>
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
                        className="flex-1"
                        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12 }}
                        data={chats}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        inverted
                        keyboardShouldPersistTaps="handled"
                        onEndReached={loadOlderMessages}
                    />
                    <SendTextInput setChats={setChats} convId={conversationId} />
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
};

export default ConversationScreen;
