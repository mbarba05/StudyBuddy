import { colors } from "@/assets/colors";
import { Stack } from "expo-router";
import React from "react";

export default function MatchmakingLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerTitle: "Matchmaking",
                headerTitleStyle: { color: colors.text, fontSize: 22 },
                headerStyle: { backgroundColor: colors.background },
                headerBackVisible: false,
            }}
        />
    );
}
