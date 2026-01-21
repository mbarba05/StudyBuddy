import { colors } from "@/assets/colors";
import { ListSeparator } from "@/components/ui/Seperators";
import { getIncomingFriendRequests } from "@/services/friendshipsService";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { IncomingFriendRequest } from "./requests";

const SocialScreen = () => {
    const [requests, setRequests] = useState<IncomingFriendRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            let mounted = true;

            const fetchRequests = async () => {
                try {
                    setLoading(true);
                    const reqs = await getIncomingFriendRequests();
                    if (mounted) {
                        setRequests(reqs as IncomingFriendRequest[]);
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
        }, [])
    );

    //if (loading) return <LoadingScreen />;

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
        </View>
    );
};

export default SocialScreen;
