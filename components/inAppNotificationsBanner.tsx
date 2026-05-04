import { useInAppNotifications } from "@/services/auth/inAppNotifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function InAppNotificationBanner() {
    const { currentNotification, clearNotification } = useInAppNotifications();
    const router = useRouter();

    const translateY = useRef(new Animated.Value(-120)).current;

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

        if (currentNotification.type === "chat_message") {
            router.push(`social/chat/${currentNotification.conversationId}`);
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
