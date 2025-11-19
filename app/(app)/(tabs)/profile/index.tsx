import CourseProfDisplayWidget from "@/components/features/courses/CourseProfDisplayWidget";
import { BlueButton, RedButton } from "@/components/ui/Buttons";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useAuth } from "@/services/auth/AuthProvider";
import { CourseProfDisplay } from "@/services/courseService";
import { getCoursesForProfile } from "@/services/enrollmentService";
import { getUserProfile, Profile } from "@/services/profileService";
import { getFriendsCount } from "@/services/friendshipsService";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
    const { signOut, user } = useAuth();
    const { refreshKey } = useLocalSearchParams();
    const router = useRouter();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [courses, setCourses] = useState<CourseProfDisplay[] | null>(null);
    const [loading, setLoading] = useState(true);

    // Friends count use State 
    const [friendCount, setFriendCount] = useState<number | null>(null);

    useEffect(() => {
        if (user?.id) {
            getFriendsCount(user.id).then(setFriendCount);
        }
    }, [user?.id]);

    const friendsLabel =
        friendCount === 0
            ? "0"
            : friendCount === 1
            ? "1"
            : `${friendCount} `;

    
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
        <SafeAreaView className="flex-1 justify-center items-center bg-colors-background px-12 gap-4">

            
            <Image
                className="w-72 h-72 rounded-full border-2 border-colors-text mb-4"
                source={{ uri: profile?.pp_url }}
            />

           
            <View className="flex flex-row gap-12">
                <View>
                    <Text className="text-center color-colors-textSecondary">Name</Text>
                    <Text className="font-semibold text-2xl text-colors-text">{profile?.display_name}</Text>
                </View>
                <View>
                    <Text className="color-colors-textSecondary text-center">Year</Text>
                    <Text className="font-semibold text-2xl text-colors-text">{profile?.year}</Text>
                </View>
            </View>

            
            <View>
                <Text className="color-colors-textSecondary text-center">Major</Text>
                <Text className="font-semibold text-2xl text-colors-text">{profile?.major.name}</Text>
            </View>

           
            <View className="items-center mt-2">
                <Text className="color-colors-textSecondary text-center">Friends</Text>

                <TouchableOpacity onPress={() => router.push("/friendsList")}>
                    <Text className="text-colors-text text-lg font-semibold underline">
                        {friendsLabel}
                    </Text>
                </TouchableOpacity>
            </View>

           
            <View className="mt-4">
                <Text className="color-colors-textSecondary text-center mb-2">Courses</Text>
                {!courses || courses.length === 0 ? (
                    <Text className="text-colors-textSecondary text-2xl text-left">
                        You are not enrolled in any courses.
                    </Text>
                ) : (
                    <View
                        className={`flex ${
                            courses ? "flex-row" : ""
                        } justify-center flex-wrap gap-4 min-h-14 border border-colors-text rounded-lg p-4 text-colors-text`}
                    >
                        {courses.map((item: CourseProfDisplay) => (
                            <View key={item.course_prof_id}>
                                <CourseProfDisplayWidget {...item} />
                            </View>
                        ))}
                    </View>
                )}
            </View>

         
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
