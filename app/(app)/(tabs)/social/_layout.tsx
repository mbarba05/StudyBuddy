import { colors } from "@/assets/colors";
import { Stack } from "expo-router";

export default function SocialStack() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: true,
                    headerTitle: "Social",
                    headerTitleStyle: { color: colors.text, fontSize: 22 },
                    headerStyle: { backgroundColor: colors.background },
                    headerBackVisible: false,
                }}
            />
            <Stack.Screen
                name="requests"
                options={{
                    headerShown: true,
                    headerTitle: "Accept Requests",
                    headerTitleStyle: { color: colors.text, fontSize: 22 },
                    headerStyle: { backgroundColor: colors.background },
                }}
            />
        </Stack>
    );
}
