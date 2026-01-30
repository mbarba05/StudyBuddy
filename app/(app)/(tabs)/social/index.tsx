import { colors } from "@/assets/colors";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { ListSeparator } from "@/components/ui/Seperators";
import { formatMessageTime } from "@/lib/utillities";
import { getIncomingFriendRequests } from "@/services/friendshipsService";
import { DMConversation, getChatsWithRecentMessage } from "@/services/messageService";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { IncomingFriendRequest } from "./requests";

const SocialScreen = () => {
    const [requests, setRequests] = useState<IncomingFriendRequest[]>([]);
    const [chats, setChats] = useState<DMConversation[] | null>([]);
    const [loading, setLoading] = useState(true);
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

    const ChatListItem = useCallback(
        ({ item }: { item: DMConversation }) => {
            return (
                <TouchableOpacity
                    className="flex-row items-center justify-between py-2 border-b border-colors-textSecondary w-full"
                    onPress={() =>
                        router.push({
                            pathname: "",
                            params: {},
                        })
                    }
                >
                    <View className="flex-row gap-4 flex-1">
                        <Image
                            className="w-16 h-16 rounded-full border border-colors-text"
                            source={{ uri: item?.pp_url as string }}
                        />
                        <View className="flex-1">
                            <Text className="color-colors-text text-2xl font-semibold">{item.dm_name}</Text>
                            <Text
                                className="color-colors-textSecondary text-lg"
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {item.last_message}
                            </Text>
                        </View>
                    </View>
                    <View>
                        {item.last_message_at && (
                            <Text className="color-colors-textSecondary text-lg">
                                {formatMessageTime(item.last_message_at)}
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>
            );
        },
        [router],
    );
    const keyExtractor = useCallback((item: DMConversation) => String(item.conversation_id), []);

    if (loading) return <LoadingScreen />;

    return (
        <View className="flex-1 bg-colors-background p-2">
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
            {chats && (
                <FlatList
                    keyExtractor={keyExtractor}
                    data={chats}
                    renderItem={ChatListItem}
                />
            )}
        </View>
    );
};

export default SocialScreen;
