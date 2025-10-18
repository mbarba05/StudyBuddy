import { RedButton } from "@/components/ui/Buttons";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useAuth } from "@/services/auth/AuthProvider";
import { getUserProfile, Profile } from "@/services/profileService";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
    const { signOut, user } = useAuth();

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
        <SafeAreaView className="flex-1 justify-center items-center bg-colors-background">
            <RedButton onPress={signOut}>Sign Out</RedButton>
        </SafeAreaView>
    );
}
