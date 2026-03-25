import { colors } from "@/assets/colors";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { ListSeparator } from "@/components/ui/Seperators";
import { SearchBar } from "@/components/ui/TextInputs";
import supabase from "@/lib/subapase";
import { formatMessageTime } from "@/lib/utillities";
import { getIncomingFriendRequests } from "@/services/friendshipsService";
import { DMConversation, getChatsWithRecentMessage, updateReadMessage } from "@/services/messageService";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { IncomingFriendRequest } from "./requests";

const SocialScreen = () => {
    const [requests, setRequests] = useState<IncomingFriendRequest[]>([]);
    const [chats, setChats] = useState<DMConversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterVal, setFilterVal] = useState("");
    const [initialLoad, setInitialLoad] = useState(true);

    const router = useRouter();

    const shownChats = useMemo(() => {
        if (!filterVal) return chats;
        const q = filterVal.toLowerCase();
        return chats.filter((c) => c.dm_name.toLowerCase().includes(q));
    }, [chats, filterVal]);

    const fetchInbox = useCallback(async () => {
        const [reqs, dms] = await Promise.all([getIncomingFriendRequests(), getChatsWithRecentMessage()]);
        setRequests(reqs as IncomingFriendRequest[]);
        setChats(dms as DMConversation[]);
        setInitialLoad(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            let mounted = true;

            const run = async () => {
                try {
                    setLoading(true);
                    const [reqs, dms] = await Promise.all([getIncomingFriendRequests(), getChatsWithRecentMessage()]);

                    if (!mounted) return;

                    setRequests(reqs as IncomingFriendRequest[]);
                    setChats(dms as DMConversation[]);
                    setInitialLoad(false);
                } finally {
                    if (mounted) setLoading(false);
                }
            };

            run();

            return () => {
                mounted = false;
            };
        }, []),
    );

    // Subscribe to conversation updates. Keep stable subscriptions based on conversation ids.
    useEffect(() => {
        if (chats.length === 0) return;

        let alive = true;

        const channels = chats.map((chat) =>
            supabase
                .channel(`conv:${chat.conversation_id}`)
                .on(
                    "postgres_changes",
                    {
                        event: "UPDATE",
                        schema: "public",
                        table: "conversations",
                        filter: `id=eq.${chat.conversation_id}`,
                    },
                    async () => {
                        if (!alive) return;

                        // Refetch inbox when this conversation updates
                        try {
                            const dms = await getChatsWithRecentMessage();
                            if (!alive) return;
                            setChats(dms as DMConversation[]);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        } catch {
                            // swallow (optional: add logging)
                        }
                    },
                )
                .subscribe(),
        );

        return () => {
            alive = false;
            channels.forEach((ch) => supabase.removeChannel(ch));
        };
    }, [chats]);

    const openChat = useCallback(
        async (item: DMConversation) => {
            updateReadMessage(item.last_message_id, item.conversation_id);

            setChats((prev) =>
                prev.map((chat) => (chat.conversation_id === item.conversation_id ? { ...chat, read: true } : chat)),
            );

            router.push({
                pathname: "/social/chat/[conversationId]",
                params: {
                    conversationId: item.conversation_id,
                    dmName: item.dm_name,
                    ppPic: item.pp_url,
                },
            });
        },
        [router],
    );

    const renderItem = useCallback(
        ({ item }: { item: DMConversation }) => {
            return (
                <TouchableOpacity
                    className="flex-row items-center justify-between py-2 border-b border-colors-textSecondary w-full"
                    onPress={() => openChat(item)}
                >
                    <View className="flex-row gap-4 flex-1">
                        <Image
                            contentFit="cover"
                            source={{ uri: item.pp_url as string }}
                            style={{
                                width: 54,
                                height: 54,
                                borderRadius: 27,
                                borderColor: colors.textSecondary,
                                borderWidth: 1,
                            }}
                            cachePolicy="memory-disk"
                        />
                        <View className="flex-1">
                            <Text className="color-colors-text text-2xl font-semibold">{item.dm_name}</Text>
                            <Text
                                className={`${item.read ? "color-colors-textSecondary" : "color-colors-text font-semibold"} text-lg`}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {item.last_message && item.last_message?.length > 0 ? item.last_message : "Attachment"}
                            </Text>
                        </View>
                    </View>

                    <View className="flex flex-row items-center gap-2">
                        {item.last_message_at && (
                            <Text className="color-colors-textSecondary text-lg">
                                {formatMessageTime(item.last_message_at)}
                            </Text>
                        )}
                        {!item.read && <View className="rounded-full w-3 h-3 bg-colors-accent" />}
                    </View>
                </TouchableOpacity>
            );
        },
        [openChat],
    );

    const keyExtractor = useCallback((item: DMConversation) => String(item.conversation_id), []);

    if (loading && initialLoad) return <LoadingScreen />;

    return (
        <View className="flex-1 bg-colors-background p-2">
            <SearchBar placeholder="Find Chat" value={filterVal} onChangeText={setFilterVal} />

            {requests.length > 0 && (
                <TouchableOpacity
                    className="flex items-center justify-center border-b border-b-colors-textSecondary p-2"
                    onPress={() => router.push("/(tabs)/social/requests")}
                >
                    <View className="flex flex-row gap-2">
                        <Ionicons name="person-add" size={24} color={colors.accent} />
                        <Text className="text-2xl font-semibold color-colors-accent">
                            Pending Friend Requests ({requests.length})
                        </Text>
                    </View>
                    <ListSeparator />
                </TouchableOpacity>
            )}

            <FlatList keyExtractor={keyExtractor} data={shownChats} renderItem={renderItem} />
        </View>
    );
};

export default SocialScreen;
