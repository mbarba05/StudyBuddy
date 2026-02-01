import { colors } from "@/assets/colors";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { ListSeparator } from "@/components/ui/Seperators";
import { SearchBar } from "@/components/ui/TextInputs";
import supabase from "@/lib/subapase";
import { formatMessageTime } from "@/lib/utillities";
import { getIncomingFriendRequests } from "@/services/friendshipsService";
import { DMConversation, getChatsWithRecentMessage, updateReadMessage } from "@/services/messageService";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { IncomingFriendRequest } from "./requests";

const SocialScreen = () => {
    const [requests, setRequests] = useState<IncomingFriendRequest[]>([]);
    const [chats, setChats] = useState<DMConversation[]>([]);
    const [shownChats, setShownChats] = useState<DMConversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterVal, setFilterVal] = useState("");
    const [initialLoad, setInitialLoad] = useState(true);

    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            let mounted = true;

            const fetchRequests = async () => {
                try {
                    setLoading(true);
                    const reqs = await getIncomingFriendRequests();
                    const dms = await getChatsWithRecentMessage();
                    if (mounted) {
                        setRequests(reqs as IncomingFriendRequest[]);
                        setChats(dms as DMConversation[]);
                        setShownChats(dms as DMConversation[]);
                        setInitialLoad(false);
                    }
                } finally {
                    if (mounted) setLoading(false);
                }
            };

            fetchRequests();

            // cleanup when screen loses focus
            return () => {
                mounted = false;
            };
        }, []),
    );

    useEffect(() => {
        if (!chats) return;

        if (!filterVal) {
            setShownChats(chats);
            return;
        }

        const filtered = chats.filter((c) => c.dm_name.toLowerCase().includes(filterVal.toLowerCase()));

        setShownChats(filtered);
    }, [filterVal, chats]);

    const refetchInbox = useCallback(async () => {
        const dms = await getChatsWithRecentMessage();
        setChats(dms as DMConversation[]);

        // keep filtering behavior consistent
        setShownChats((prevShown) => {
            const next = dms as DMConversation[];
            if (!filterVal) return next;
            return next.filter((c) => c.dm_name.toLowerCase().includes(filterVal.toLowerCase()));
        });
    }, [filterVal]);

    useEffect(() => {
        if (chats.length === 0) return;

        // one channel per conversation row
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
                    () => {
                        // refetch inbox whenever that conversation updates
                        refetchInbox();
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); //vibration
                    },
                )
                .subscribe(),
        );

        return () => {
            channels.forEach((ch) => supabase.removeChannel(ch));
        };
    }, [refetchInbox, chats]);

    const ChatListItem = useCallback(
        ({ item }: { item: DMConversation }) => {
            const openChat = async (item: DMConversation) => {
                await updateReadMessage(item.last_message_id, item.conversation_id);
                item.read = true;

                setChats((prev) =>
                    prev.map((chat) =>
                        chat.conversation_id === item.conversation_id ? { ...chat, read: true } : chat,
                    ),
                );

                router.push({
                    pathname: "/social/chat/[conversationId]",
                    params: { conversationId: item.conversation_id, dmName: item.dm_name, ppPic: item.pp_url },
                });
            };

            return (
                <TouchableOpacity
                    className="flex-row items-center justify-between py-2 border-b border-colors-textSecondary w-full"
                    onPress={() => openChat(item)}
                >
                    <View className="flex-row gap-4 flex-1">
                        <Image
                            className="w-16 h-16 rounded-full border border-colors-text"
                            source={{ uri: item?.pp_url as string }}
                        />
                        <View className="flex-1">
                            <Text className="color-colors-text text-2xl font-semibold">{item.dm_name}</Text>
                            <Text
                                className={`${item.read ? "color-colors-textSecondary" : "color-colors-text font-semibold"} text-lg`}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {item.last_message}
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
        [router],
    );
    const keyExtractor = useCallback((item: DMConversation) => String(item.conversation_id), []);

    if (loading && initialLoad) return <LoadingScreen />;

    return (
        <View className="flex-1 bg-colors-background p-2">
            <SearchBar
                placeholder="Find Chat"
                value={filterVal}
                onChangeText={setFilterVal}
            />
            {requests.length > 0 && (
                <TouchableOpacity
                    className="flex items-center justify-center border-b border-b-colors-textSecondary p-2"
                    onPress={() => router.push("/(tabs)/social/requests")}
                >
                    <View className="flex flex-row gap-2">
                        <Ionicons
                            name="person-add"
                            size={24}
                            color={colors.accent}
                        />
                        <Text className="text-2xl font-semibold color-colors-accent">
                            Pending Friend Requests ({requests.length})
                        </Text>
                    </View>
                    <ListSeparator />
                </TouchableOpacity>
            )}
            {shownChats && (
                <FlatList
                    keyExtractor={keyExtractor}
                    data={shownChats}
                    renderItem={ChatListItem}
                />
            )}
        </View>
    );
};

export default SocialScreen;
