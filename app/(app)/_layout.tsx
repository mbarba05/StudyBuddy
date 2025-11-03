// app/(app)/_layout.tsx
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useAuth } from "@/services/auth/AuthProvider";
import { useProfileGate } from "@/services/ProfileProvider";
import { Redirect, Stack, usePathname } from "expo-router";

const CREATE_PROFILE = "/create-profile";

export default function ProtectedLayout() {
    const { user, authReady } = useAuth();
    const { profileReady, hasProfile } = useProfileGate();
    const pathname = usePathname();

    if (!authReady || !profileReady) return <LoadingScreen />;

    if (!user) return <Redirect href="/(auth)/login" />;

    if (hasProfile === false && pathname !== CREATE_PROFILE) {
        return <Redirect href={CREATE_PROFILE} />;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
        </Stack>
    );
}
