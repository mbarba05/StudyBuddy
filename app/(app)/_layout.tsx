// app/(app)/_layout.tsx
import { Stack } from "expo-router";

export default function AppLayout() {
    //logic to redirect

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="create-profile"
                options={{ headerShown: true, title: "Create Profile" }}
            />
            <Stack.Screen name="(tabs)" />
        </Stack>
    );
}
