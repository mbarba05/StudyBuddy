import { ListSeparator } from "@/components/ui/Seperators";
import { getIncomingFriendRequests } from "@/services/friendshipsService";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IncomingFriendRequest } from "./requests";

const SocialScreen = () => {
    const [requests, setRequests] = useState<IncomingFriendRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

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
    }, []);

    if (loading) return;

    return (
        <SafeAreaView className="flex-1 bg-colors-background p-4">
            {requests && (
                <TouchableOpacity
                    className="flex items-center justify-center border-b border-b-colors-textSecondary p-2"
                    onPress={() => router.push("/(tabs)/social/requests")}
                >
                    <Text className="text-2xl font-semibold color-colors-accent">
                        Pending Friend Requests ({requests.length})
                    </Text>
                    <ListSeparator />
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
};

export default SocialScreen;
