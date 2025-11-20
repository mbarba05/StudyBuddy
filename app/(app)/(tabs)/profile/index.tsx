import CourseProfDisplayWidget from "@/components/features/courses/CourseProfDisplayWidget";
import { LoginButton } from "@/components/ui/Buttons";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { SectionSeperator } from "@/components/ui/Seperators";
import { useAuth } from "@/services/auth/AuthProvider";
import { CourseProfDisplay } from "@/services/courseService";
import { getEnrollmentsForProfile } from "@/services/enrollmentService";
import { getFriendsCount } from "@/services/friendshipsService";
import { getUserProfile, Profile } from "@/services/profileService";
import { getCurrentAndNextTerm, Term } from "@/services/termsService";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
    const { signOut } = useAuth();
    const router = useRouter();
    const { refreshKey } = useLocalSearchParams<{ refreshKey?: string }>();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [currCourses, setCurrCourses] = useState<CourseProfDisplay[] | null>(null);
    const [nextCourses, setNextCourses] = useState<CourseProfDisplay[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [currAndNextTerm, setCurrAndNextTerm] = useState<[Term, Term] | null>(null);

    // Friends count use State
    const [friendCount, setFriendCount] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            setLoading(true);
            try {
                const [prof, enrollments, terms, friends] = await Promise.all([
                    getUserProfile(),
                    getEnrollmentsForProfile(),
                    getCurrentAndNextTerm(),
                    getFriendsCount(),
                ]);

                if (cancelled) return;

                setProfile(prof);
                setCurrAndNextTerm(terms || null);
                setFriendCount(friends);

                if (terms) {
                    const currTermCourses =
                        enrollments?.filter((enrollment) => enrollment.term === terms[0].name) || [];
                    const nextTermCourses =
                        enrollments?.filter((enrollment) => enrollment.term === terms[1].name) || [];

                    setCurrCourses(currTermCourses);
                    setNextCourses(nextTermCourses);
                } else {
                    setCurrCourses([]);
                    setNextCourses([]);
                }
            } catch (e) {
                if (!cancelled) {
                    console.error("Error loading profile data", e);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            cancelled = true;
        };
    }, [refreshKey]);

    if (loading) return <LoadingScreen />;

    return (
        <View className="flex-1 items-center  bg-colors-background gap-4 p-2">
            <View className="flex flex-row gap-12 items-center justify-between w-full">
                <View className="w-1/3">
                    <Image
                        className="w-48 h-48 rounded-full border border-colors-text "
                        source={{ uri: profile?.pp_url as string }}
                    />
                </View>
                <View className="flex w-2/3 gap-2">
                    <View>
                        <Text className="text-left color-colors-textSecondary">Name</Text>
                        <Text className="font-semibold text-2xl text-colors-text">{profile?.display_name}</Text>
                    </View>

                    <View>
                        <Text className="color-colors-textSecondary text-left">Major</Text>
                        <Text className="font-semibold text-2xl text-colors-text">{profile?.major.name}</Text>
                    </View>
                    <View className="flex flex-row gap-12">
                        <View>
                            <Text className="color-colors-textSecondary text-left">Year</Text>
                            <Text className="font-semibold text-2xl text-colors-text">{profile?.year}</Text>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => router.push("(tabs)/profile/friendsList")}>
                                <Text className="color-colors-textSecondary text-center">Friends</Text>
                                <Text className="text-colors-text text-2xl text-center font-semibold">
                                    {friendCount}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
            <View className="w-full">
                <Text className=" color-colors-textSecondary text-left mb-1">
                    Current Term Courses ({currAndNextTerm && currAndNextTerm[0].name})
                </Text>
                <SectionSeperator />

                <View
                    className={`flex ${
                        currCourses ? "flex-row" : ""
                    } flex-wrap gap-4 min-h-14  rounded-lg justify-center  text-colors-text mt-4`}
                >
                    {!currCourses || currCourses.length === 0 || !currAndNextTerm ? (
                        <Text className="text-colors-textSecondary text-2xl text-left">
                            You are not enrolled in any courses this term.
                        </Text>
                    ) : (
                        currCourses.map((item: CourseProfDisplay) => (
                            <View key={item.course_prof_id}>
                                <CourseProfDisplayWidget
                                    code={item.course_code}
                                    name={item.prof_name}
                                />
                            </View>
                        ))
                    )}
                </View>
            </View>
            <View className="w-full">
                <Text className=" color-colors-textSecondary text-left mb-1">
                    Next Term Courses ({currAndNextTerm && currAndNextTerm[1].name})
                </Text>
                <SectionSeperator />

                <View
                    className={`flex ${
                        nextCourses ? "flex-row" : ""
                    } flex-wrap gap-4 min-h-14 rounded-lg justify-center text-colors-text mt-4`}
                >
                    {!nextCourses || nextCourses.length === 0 || !currAndNextTerm ? (
                        <Text className="text-colors-textSecondary text-lg text-center">
                            You are not enrolled in any courses this term.
                        </Text>
                    ) : (
                        nextCourses.map((item: CourseProfDisplay) => (
                            <View key={item.course_prof_id}>
                                <CourseProfDisplayWidget
                                    code={item.course_code}
                                    name={item.prof_name}
                                />
                            </View>
                        ))
                    )}
                </View>
            </View>
            <View className="flex w-full gap-2 mt-auto">
                <LoginButton
                    bgColor="bg-colors-secondary"
                    textColor="color-colors-text"
                    onPress={() => router.push("/(tabs)/profile/edit")}
                >
                    Edit Profile
                </LoginButton>

                <LoginButton
                    bgColor="bg-colors-primary"
                    textColor="color-colors-text"
                    onPress={signOut}
                >
                    Sign Out
                </LoginButton>
            </View>
        </View>
    );
}
