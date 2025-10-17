import { Stack } from "expo-router";

export default function ProfileStack() {
    return (
        <Stack>
            <Stack.Screen name="index" />
            <Stack.Screen name="edit" />
            <Stack.Screen name="create" />
        </Stack>
    );
}
