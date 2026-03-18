import { colors } from "@/assets/colors";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Pressable } from "react-native";

export default function MatchmakingLayout() {
    const router = useRouter();
    const searchBar = () => (
        <Pressable
            className="flex items-center justify-center left-1.5"
            onPress={() => router.push("matchmaking/search")}
        >
            <Ionicons name="search" size={24} color={colors.text} />
        </Pressable>
    );

    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: true,
                    headerTitle: "Matchmaking",
                    headerTitleStyle: { color: colors.text, fontSize: 22 },
                    headerStyle: { backgroundColor: colors.background },
                    headerRight: searchBar,
                    headerBackVisible: false,
                }}
            />
            <Stack.Screen
                name="search"
                options={{
                    headerShown: true,
                    headerTitle: "Search",
                    headerTitleStyle: { color: colors.text, fontSize: 22 },
                    headerStyle: { backgroundColor: colors.background },
                    headerBackVisible: true,
                }}
            />
            <Stack.Screen
                name="viewProfile"
                options={{
                    headerShown: true,
                    headerTitle: "",
                    //headerTitleStyle: { color: colors.text, fontSize: 22 },
                    headerStyle: { backgroundColor: colors.background },
                    headerBackVisible: true,
                }}
            />
        </Stack>
    );
}
