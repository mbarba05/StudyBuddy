import { BlueButton, RedButton } from "@/components/ui/Buttons";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useAuth } from "@/services/auth/AuthProvider";
import { getUserProfile, Profile } from "@/services/profileService";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
    const { signOut, user } = useAuth();
    const router = useRouter();

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
            <Image
                className="w-72 h-72 rounded-full border-2 border-colors-text"
                source={{ uri: profile?.pp_url }}
            ></Image>
            <Text className="text-colors-text">{profile?.display_name}</Text>
            <Text className="text-colors-text">{profile?.year}</Text>
            <Text className="text-colors-text">{profile?.major.name}</Text>
            <BlueButton onPress={() => router.push("/(tabs)/profile/edit")}>
                Edit Profile
            </BlueButton>
            <RedButton onPress={signOut}>Sign Out</RedButton>
        </SafeAreaView>
    );
}
