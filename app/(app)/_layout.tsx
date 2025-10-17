import { useAuth } from "@/services/auth/AuthProvider";
import { hasProfileByUserId } from "@/services/profileService";
import { Stack, router, usePathname } from "expo-router";
import { useEffect, useRef, useState } from "react";

export default function AppLayout() {
    const { user } = useAuth();
    const pathname = usePathname();

    const [ready, setReady] = useState(false);
    const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(
        null
    );

    // refs to avoid duplicate navs
    const checkedUserId = useRef<string | null>(null);
    const navigated = useRef(false);

    //check profile once per signed-in user
    useEffect(() => {
        let mounted = true;

        (async () => {
            if (!user) {
                setReady(true);
                setNeedsOnboarding(null);
                checkedUserId.current = null;
                navigated.current = false;
                return;
            }

            if (checkedUserId.current === user.id) {
                setReady(true);
                return;
            }

            // if we are already on create profile, mark that we need onboarding
            if (pathname === "/(app)/create-profile") {
                checkedUserId.current = user.id;
                setNeedsOnboarding(true);
                setReady(true);
                return;
            }

            // do the existence check once
            const exists = await hasProfileByUserId(user.id);
            if (!mounted) return;

            checkedUserId.current = user.id;
            setNeedsOnboarding(!exists);
            setReady(true);
        })();

        return () => {
            mounted = false;
        };
    }, [user, pathname]);

    useEffect(() => {
        if (!user) return;
        if (needsOnboarding !== true) return;
        if (pathname === "/(app)/create-profile") return;
        if (navigated.current) return;

        navigated.current = true;
        router.replace("/(app)/create-profile");
    }, [needsOnboarding, pathname, user]);

    if (!ready && pathname !== "/(app)/create-profile") return null;

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
