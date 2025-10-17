import { RedButton } from "@/components/ui/Buttons";
import { useAuth } from "@/services/auth/AuthProvider";
import { getUserProfile, Profile } from "@/services/profileService";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
    const { signOut } = useAuth();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            const prof = await getUserProfile();
            if (mounted) {
                setProfile(prof);
                setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    console.log("prfile", profile);
    if (loading) return null; //TODO: make loading image

    return (
        <SafeAreaView className="flex-1 justify-center items-center bg-colors-background">
            <RedButton onPress={signOut}>Sign Out</RedButton>
        </SafeAreaView>
    );
}
