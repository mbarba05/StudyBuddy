import LoadingScreen from "@/components/ui/LoadingScreen";
import { useAuth } from "@/services/auth/AuthProvider";
import { hasProfile } from "@/services/profileService";
import { Redirect, Stack, usePathname } from "expo-router";
import { useEffect, useState } from "react";

export default function AppLayout() {
    const { user } = useAuth();
    const pathname = usePathname();
    const CREATE_PROFILE = "/create-profile";
    const [loading, setloading] = useState(false);
    const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(
        null
    );

    useEffect(() => {
        let mounted = true;

        const checkProfile = async () => {
            if (!user) {
                if (mounted) {
                    setNeedsOnboarding(null);
                    setloading(true);
                }
                return;
            }

            const profile = await hasProfile(user.id);
            if (!mounted) return;
            setNeedsOnboarding(!profile);
            setloading(true);
        };

        checkProfile();
        return () => {
            mounted = false;
        };
    }, [user]);

    if (!loading) {
        return <LoadingScreen />;
    }

    if (user && needsOnboarding && pathname !== CREATE_PROFILE) {
        return <Redirect href={CREATE_PROFILE} />;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="create-profile"
                options={{
                    headerShown: true,
                    title: "Create Profile",
                    animation: "none",
                }}
            />
            <Stack.Screen name="(tabs)" />
        </Stack>
    );
}
