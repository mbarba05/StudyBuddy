import LoadingScreen from "@/components/ui/LoadingScreen";
import { useAuth } from "@/services/auth/AuthProvider";
import { getUserProfile, Profile } from "@/services/profileService";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";

export default function ProfileStack() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const getProfile = async () => {
            const prof = await getUserProfile(user?.id || null);
            if (mounted) {
                setProfile(prof);
                setLoading(false);
            }
        };
        getProfile();
        return () => {
            mounted = false;
        };
    }, [user?.id]);

    console.log("prfile", profile);
    if (loading) return <LoadingScreen />;

    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="edit" options={{ headerShown: false }} />
        </Stack>
    );
}
