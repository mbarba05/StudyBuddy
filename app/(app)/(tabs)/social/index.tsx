import { colors } from "@/assets/colors";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { ListSeparator } from "@/components/ui/Seperators";
import { getIncomingFriendRequests } from "@/services/friendshipsService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { IncomingFriendRequest } from "./requests";

const SocialScreen = () => {
    const [requests, setRequests] = useState<IncomingFriendRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { refreshKey } = useLocalSearchParams<{ refreshKey?: string }>();

    useEffect(() => {
        let mounted = true;
        const getProfile = async () => {
            setLoading(true);
            const reqs = await getIncomingFriendRequests();
            if (mounted) {
                setRequests(reqs);
                setLoading(false);
            }
        };
        getProfile();
        return () => {
            mounted = false;
        };
    }, [refreshKey]);

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
        </View>
    );
};

export default SocialScreen;
