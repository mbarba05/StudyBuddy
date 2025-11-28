import { colors } from "@/assets/colors";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useAuth } from "@/services/auth/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { View } from "react-native";

export default function AppLayout() {
    const { user, loading } = useAuth();
    if (loading) return <LoadingScreen />;

    if (!user) return <Redirect href="/(auth)/login" />;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveBackgroundColor: colors.secondary,
                tabBarInactiveBackgroundColor: colors.background,
                tabBarLabelStyle: { color: colors.text },
                tabBarStyle: { backgroundColor: colors.background },
            }}
        >
            <Tabs.Screen
                name="reviews"
                options={{
                    title: "",
                    tabBarIcon: () => (
                        <View className="mt-1">
                            <Ionicons
                                name="pencil"
                                size={25}
                                color={colors.text}
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="matchmaking"
                options={{
                    title: "",
                    tabBarIcon: () => (
                        <View className="mt-1">
                            <Ionicons
                                name="heart"
                                size={25}
                                color={colors.text}
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="index"
                options={{
                    title: "",
                    tabBarIcon: () => (
                        <View className="mt-1">
                            <Ionicons
                                name="home"
                                size={25}
                                color={colors.text}
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="social"
                options={{
                    title: "",
                    tabBarIcon: () => (
                        <View className="mt-1">
                            <Ionicons
                                name="chatbox"
                                size={25}
                                color={colors.text}
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "",
                    tabBarIcon: () => (
                        <View className="mt-1">
                            <Ionicons
                                name="person-circle"
                                size={25}
                                color={colors.text}
                            />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}
