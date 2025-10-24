import LoadingScreen from "@/components/ui/LoadingScreen";
import { useAuth } from "@/services/auth/AuthProvider";
import { useOnboarding } from "@/services/OnboardingProvider";
import { Redirect, Stack, usePathname } from "expo-router";

export default function AppLayout() {
    const { user } = useAuth();
    const { ready, needsOnboarding } = useOnboarding();
    const pathname = usePathname();
    const CREATE_PROFILE = "/create-profile";

    if (!ready) return <LoadingScreen />;

    if (user && needsOnboarding && pathname !== CREATE_PROFILE) {
        return <Redirect href={CREATE_PROFILE} />;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="create-profile"
                options={{ title: "Create Profile", animation: "none" }}
            />
            <Stack.Screen name="(tabs)" />
        </Stack>
    );
}
