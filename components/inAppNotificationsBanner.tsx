import supabase from "@/lib/subapase";
import { useAuth } from "@/services/auth/AuthProvider";
import { triggerInAppNotification, useInAppNotifications } from "@/services/auth/inAppNotifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function InAppNotificationBanner() {
    const { currentNotification, clearNotification } = useInAppNotifications();
    const { user } = useAuth();
    const router = useRouter();

    const translateY = useRef(new Animated.Value(-120)).current;

    useEffect(() => {
        if (!user?.id) return;

        const getDisplayName = async (userId: string) => {
            const { data } = await supabase
                .from("profiles")
                .select("display_name")
                .eq("user_id", userId)
                .single();

            return data?.display_name ?? "Someone";
        };

        const friendRequestsChannel = supabase
            .channel(`in-app-friend-requests:${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "friend_requests",
                    filter: `receiver_id=eq.${user.id}`,
                },
                async (payload) => {
                    const senderId = payload.new.sender_id as string;
                    const senderName = await getDisplayName(senderId);

                    triggerInAppNotification({
                        type: "friend_request",
                        message: `${senderName} has sent you a friend request`,
                    });
                },
            )
            .subscribe();

        const friendAcceptedChannel = supabase
            .channel(`in-app-friend-accepted:${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "friend_requests",
                    filter: `sender_id=eq.${user.id}`,
                },
                async (payload) => {
                    if (payload.new.status !== "accepted") return;

                    const accepterId = payload.new.receiver_id as string;
                    const accepterName = await getDisplayName(accepterId);

                    triggerInAppNotification({
                        type: "friend_added",
                        message: `${accepterName} has accepted your friend request`,
                    });
                },
            )
            .subscribe();

        const messagesChannel = supabase
            .channel(`in-app-messages:${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                async (payload) => {
                    const senderId = payload.new.sender_id as string;
                    if (senderId === user.id) return;

                    const senderName = await getDisplayName(senderId);

                    triggerInAppNotification({
                        type: "chat_message",
                        message: `${senderName} sent you a message`,
                        conversationId: payload.new.conversation_id as string,
                    });
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(friendRequestsChannel);
            supabase.removeChannel(friendAcceptedChannel);
            supabase.removeChannel(messagesChannel);
        };
    }, [user?.id]);

    useEffect(() => {
        if (currentNotification) {
            // Slide down
            Animated.timing(translateY, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
            }).start();

            // Slide up after timer
            const timer = setTimeout(() => {
                Animated.timing(translateY, {
                    toValue: -120,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    clearNotification();
                });
            }, 6000);

            return () => clearTimeout(timer);
        }
    }, [currentNotification]);

    if (!currentNotification) return null;

    const handlePress = () => {
        if (currentNotification.type === "friend_request") {
            router.push("/friends/requests");
        }

        if (currentNotification.type === "friend_added") {
            router.push("/friends");
        }

        if (currentNotification.type === "chat_message" && currentNotification.conversationId) {
            router.push(`/social/chat/${currentNotification.conversationId}`);
        }

        clearNotification();
    };

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
            <TouchableOpacity style={styles.banner} onPress={handlePress}>
                <Text style={styles.text}>{currentNotification.message}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 60,
        left: 10,
        right: 10,
        zIndex: 999,
    },

    banner: {
        backgroundColor: "#262626",
        padding: 15,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },

    text: {
        color: "white",
        fontSize: 14,
        fontWeight: "500",
    },
});
