import CourseProfDisplayWidget from "@/components/features/courses/CourseProfDisplayWidget";
import { BlueButton, RedButton } from "@/components/ui/Buttons";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useAuth } from "@/services/auth/AuthProvider";
import { CourseProfDisplay } from "@/services/courseService";
import { getEnrollmentsForProfile } from "@/services/enrollmentService";
import { getUserProfile, Profile } from "@/services/profileService";
import { getCurrentAndNextTerm, Term } from "@/services/termsService";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
    const { signOut, user } = useAuth();
    const { refreshKey } = useLocalSearchParams();
    const router = useRouter();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [currCourses, setCurrCourses] = useState<CourseProfDisplay[] | null>(null);
    const [nextCourses, setNextCourses] = useState<CourseProfDisplay[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [currAndNextTerm, setCurrAndNextTerm] = useState<[Term, Term] | null>(null);

    useEffect(() => {
        let mounted = true;
        const getProfile = async () => {
            const prof = await getUserProfile(user?.id || null);
            const course = await getEnrollmentsForProfile(user?.id || null);
            const terms = await getCurrentAndNextTerm();
            if (mounted) {
                setProfile(prof);
                setCurrAndNextTerm(terms);
                const currTermCourses = course?.filter((enrollment) => enrollment.term === terms?.[0].name) || [];
                const nextTermCourses = course?.filter((enrollment) => enrollment.term === terms?.[1].name) || [];
                setCurrCourses(currTermCourses);
                setNextCourses(nextTermCourses);
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
        <SafeAreaView className="flex-1 justify-center items-center bg-colors-background gap-4">
            <ScrollView
                contentInsetAdjustmentBehavior="automatic" // iOS: safe insets
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    flexGrow: 1,
                    alignItems: "center",
                    gap: 20,
                    marginTop: 20,
                }}
            >
                <Image
                    className="w-72 h-72 rounded-full border-2 border-colors-text mb-4"
                    source={{ uri: profile?.pp_url || undefined }}
                ></Image>
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
                    <Text className=" color-colors-textSecondary text-center">Major</Text>
                    <Text className="font-semibold text-2xl text-colors-text">{profile?.major.name}</Text>
                </View>
                <View className="w-5/6">
                    <Text className=" color-colors-textSecondary text-center mb-2">
                        Current Term Courses ({currAndNextTerm && currAndNextTerm[0].name})
                    </Text>

                    <View
                        className={`flex ${
                            currCourses ? "flex-row" : ""
                        } justify-center flex-wrap gap-4 min-h-14 border border-colors-text rounded-lg p-4  text-colors-text`}
                    >
                        {!currCourses || currCourses.length === 0 || !currAndNextTerm ? (
                            <Text className="text-colors-textSecondary text-2xl text-left">
                                You are not enrolled in any courses this term.
                            </Text>
                        ) : (
                            currCourses.map((item: CourseProfDisplay) => (
                                <View key={item.course_prof_id}>
                                    <CourseProfDisplayWidget {...item} />
                                </View>
                            ))
                        )}
                    </View>
                </View>
                <View className="w-5/6">
                    <Text className=" color-colors-textSecondary text-center mb-2">
                        Next Term Courses ({currAndNextTerm && currAndNextTerm[1].name})
                    </Text>
                    <View
                        className={`flex ${
                            nextCourses ? "flex-row" : ""
                        } justify-center flex-wrap gap-4 min-h-14 border border-colors-text rounded-lg p-4  text-colors-text`}
                    >
                        {!nextCourses || nextCourses.length === 0 || !currAndNextTerm ? (
                            <Text className="text-colors-textSecondary text-2xl text-left">
                                You are not enrolled in any courses this term.
                            </Text>
                        ) : (
                            nextCourses.map((item: CourseProfDisplay) => (
                                <View key={item.course_prof_id}>
                                    <CourseProfDisplayWidget {...item} />
                                </View>
                            ))
                        )}
                    </View>
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
            </ScrollView>
        </SafeAreaView>
    );
}
