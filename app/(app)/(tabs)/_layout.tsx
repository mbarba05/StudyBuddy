import LoadingScreen from "@/components/ui/LoadingScreen";
import { useAuth } from "@/services/auth/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";

export default function AppLayout() {
    const { user, loading } = useAuth();
    if (loading) return <LoadingScreen />;

    if (!user) return <Redirect href="/(auth)/login" />;

    return (
        <Tabs screenOptions={{ headerShown: true }}>
            <Tabs.Screen
                name="reviews"
                options={{
                    title: "Reviews",
                    tabBarIcon: ({ focused }) => (
                        <Ionicons name="pencil" size={20} />
                    ),
                }}
            />
            <Tabs.Screen
                name="matchmaking"
                options={{
                    title: "Matchmaking",
                    tabBarIcon: () => (
                        <Ionicons name="heart-circle" size={20} />
                    ),
                }}
            />
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ focused }) => (
                        <Ionicons name="home" size={20} />
                    ),
                }}
            />
            <Tabs.Screen
                name="social"
                options={{
                    title: "Social",
                    tabBarIcon: () => <Ionicons name="chatbox" size={20} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: () => (
                        <Ionicons name="person-circle" size={20} />
                    ),
                }}
            />
        </Tabs>
    );
}
