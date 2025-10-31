import { BlueButton, RedButton } from "@/components/ui/Buttons";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { parseLastName } from "@/lib/utillities";
import { useAuth } from "@/services/auth/AuthProvider";
import { CourseProfDisplay } from "@/services/courseService";
import { getCoursesForProfile } from "@/services/enrollmentService";
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
    const [courses, setCourses] = useState<CourseProfDisplay[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const getProfile = async () => {
            const prof = await getUserProfile(user?.id || null);
            const course = await getCoursesForProfile(user?.id || null);
            if (mounted) {
                setProfile(prof);
                setCourses(course);
                setLoading(false);
            }
        };
        getProfile();
        return () => {
            mounted = false;
        };
    }, [user?.id, refreshKey, setCourses]);

    if (loading) return <LoadingScreen />;

    return (
        <SafeAreaView className="flex-1 justify-center items-center bg-colors-background px-6">
            <Image
                className="w-72 h-72 rounded-full border-2 border-colors-text mb-4"
                source={{ uri: profile?.pp_url }}
            ></Image>
            <Text className="text-2xl font-bold text-colors-text mt-2">{profile?.display_name}</Text>
            <Text className="text-2xl text-colors-text mt-1">{profile?.year}</Text>
            <Text className="text-2xl text-colors-text mb-6">{profile?.major.name}</Text>
            {!courses ? (
                <Text className="text-colors-textSecondary text-2xl text-left mt-1">
                    You are not enrolled in any courses.
                </Text>
            ) : (
                <View
                    className={`flex ${courses && "flex-row"} justify-center flex-wrap gap-4 min-h-14 rounded-lg p-2 w-4/5 text-colors-text`}
                >
                    {courses.map((item: CourseProfDisplay) => (
                        <View
                            key={item.course_prof_id}
                            className="flex flex-row gap-2 items-center bg-colors-secondary p-1 pr-4 rounded-md"
                        >
                            <View>
                                <Text className="text-colors-text text-xl text-center">{item.course_code}</Text>
                                <Text className="text-colors-textSecondary text-xl text-center">
                                    {parseLastName(item.prof_name)}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}
            <View className="w-full items-center mt-6">
                <BlueButton
                    onPress={() => router.push("/(tabs)/profile/edit")}
                    style={{ marginBottom: 16, width: 200 }}
                >
                    Edit Profile
                </BlueButton>

                <RedButton
                    style={{ width: 200 }}
                    onPress={signOut}
                >
                    Sign Out
                </RedButton>
            </View>
        </SafeAreaView>
    );
}
