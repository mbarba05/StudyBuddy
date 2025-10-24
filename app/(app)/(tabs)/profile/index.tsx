import { BlueButton, RedButton } from "@/components/ui/Buttons";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useAuth } from "@/services/auth/AuthProvider";
import { getUserProfile, Profile } from "@/services/profileService";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
    const { signOut, user } = useAuth();
    const { refreshKey } = useLocalSearchParams();
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
    }, [user?.id, refreshKey]);

    if (loading) return <LoadingScreen />;

    return (
        <SafeAreaView className="flex-1 justify-center items-center bg-colors-background px-6">
            <Image
                className="w-72 h-72 rounded-full border-2 border-colors-text mb-4"
                source={{ uri: profile?.pp_url }}
            ></Image>
            <Text className="text-2xl font-bold text-colors-text mt-2">
                {profile?.display_name}
            </Text>
            <Text className="text-xl text-colors-text mt-1">
                {profile?.year}
            </Text>
            <Text className="text-xl text-colors-text mb-6">
                {profile?.major.name}
            </Text>
            <View className="w-full items-center mt-6">
                <BlueButton
                    onPress={() => router.push("/(tabs)/profile/edit")}
                    style={{ marginBottom: 16, width: 200 }}
                >
                    Edit Profile
                </BlueButton>

                <RedButton style={{ width: 200 }} onPress={signOut}>
                    Sign Out
                </RedButton>
            </View>
        </SafeAreaView>
    );
}
