import { colors } from "@/assets/colors";
import ChatBubble from "@/components/features/chats/ChatBubble";
import SendTextInput from "@/components/features/chats/SendTextInput";
import supabase from "@/lib/subapase";
import { useAuth } from "@/services/auth/AuthProvider";
import { Chat, getMessagesForConv } from "@/services/messageService";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Image, KeyboardAvoidingView, Platform, Text, View } from "react-native";
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
                        setChats(chat as Chat[]);
                        console.log(chats);
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
                (payload) => {
                    const newMsg = payload.new as Chat;
                    setChats((prev) => {
                        if (prev.some((m) => m.id === newMsg.id)) return prev;
                        return [newMsg, ...prev];
                    });
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

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
            <Image
                source={{ uri: ppPic }}
                className="w-12 h-12 rounded-full"
            />
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
            <SafeAreaView
                className="flex-1 bg-colors-background"
                edges={["left", "right"]}
            >
                <KeyboardAvoidingView
                    className="flex-1"
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    keyboardVerticalOffset={Platform.OS === "ios" ? tabBarHeight + insets.bottom : 0}
                >
                    <FlatList
                        className="flex-1"
                        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12 }}
                        data={chats}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        inverted
                        keyboardShouldPersistTaps="handled"
                    />
                    <SendTextInput
                        setChats={setChats}
                        convId={conversationId}
                    />
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
};

export default ConversationScreen;
