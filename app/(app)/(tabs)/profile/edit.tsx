import { colors } from "@/assets/colors";
import CourseSearchModal from "@/components/features/courses/CourseSearchModal";
import { BlueButton, RedButton } from "@/components/ui/Buttons";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { LoginInput } from "@/components/ui/TextInputs";
import { yearOptions } from "@/lib/enumFrontend";
import { parseLastName } from "@/lib/utillities";
import { useAuth } from "@/services/auth/AuthProvider";
import { CourseProfDisplay } from "@/services/courseService";
import { createEnrollments, deleteEnrollments, getCoursesForProfile } from "@/services/enrollmentService";
import { getAllMajorsForDropdown, MajorDropDownItem } from "@/services/majorsService";
import { editProfile, getUserProfile } from "@/services/profileService";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { SafeAreaView } from "react-native-safe-area-context";

const EditProfileScreen = () => {
    const { user } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [fullName, setFullName] = useState("");
    const [yearOpen, setYearOpen] = useState(false);
    const [yearValue, setYearValue] = useState<string | null>(null);
    const [majorOpen, setMajorOpen] = useState(false);
    const [majorValue, setMajorValue] = useState<number | null>(null);
    const [majorOptions, setMajorOptions] = useState<MajorDropDownItem[]>([]);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [courses, setCourses] = useState<CourseProfDisplay[] | null>(null);
    const [courseModalVisible, setCourseModalVisible] = useState(false);
    const [error, setError] = useState("");
    const enrollmentsToDelete = useRef<number[]>([]);
    const enrollmentsToAdd = useRef<number[]>([]);
    const handleOpenMajor = () => setYearOpen(false);
    const handleOpenYear = () => setMajorOpen(false);
    const majorsKey = useMemo(() => `majors-${majorOptions.length || 0}`, [majorOptions.length]);

    useEffect(() => {
        let mounted = true;

        const run = async () => {
            try {
                if (!user?.id) {
                    if (mounted) setLoading(false);
                    return;
                }

                const [majors, prof, course] = await Promise.all([
                    getAllMajorsForDropdown(),
                    getUserProfile(user.id),
                    getCoursesForProfile(user.id),
                ]);

                if (!mounted) return;

                setCourses(course);

                const normalizedMajors: MajorDropDownItem[] = (majors || []).map((m) => ({
                    label: m.label,
                    value: Number(m.value),
                }));
                setMajorOptions(normalizedMajors);

                if (prof) {
                    setFullName(prof.display_name ?? "");
                    setImageUri(prof.pp_url ?? null);
                    setYearValue(prof.year ?? null);

                    const majorId =
                        typeof prof.major === "object"
                            ? Number((prof.major as any).id)
                            : prof.major != null
                              ? Number(prof.major)
                              : null;

                    setMajorValue(Number.isFinite(majorId as number) ? (majorId as number) : null);
                }
            } catch (e) {
                console.error("Failed to load profile/majors", e);
                Alert.alert("Error", "Failed to load profile.");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        run();
        return () => {
            mounted = false;
        };
    }, [user?.id]);

    const removeCourse = (courseProfId: number, enrollmentId: number) => {
        setCourses((prev) => prev?.filter((item) => item.course_prof_id !== courseProfId) ?? null);
        if (!enrollmentsToDelete.current.includes(enrollmentId)) {
            enrollmentsToDelete.current.push(enrollmentId);
        }
        // If this course was previously queued to add, remove it
        enrollmentsToAdd.current = enrollmentsToAdd.current.filter((id) => id !== courseProfId);
    };

    const chooseCoursesPress = () => {
        if (courses && courses.length >= 6) setError("You can only choose 6 courses");
        else {
            setError("");
            setCourseModalVisible(true);
        }
    };

    const handleProfessorPicked = useCallback(
        (courseProf: CourseProfDisplay) => {
            setCourses((prev) =>
                prev?.some((c) => c.course_prof_id === courseProf.course_prof_id) ? prev : [...(prev ?? []), courseProf]
            );

            if (!enrollmentsToAdd.current.includes(courseProf.course_prof_id)) {
                enrollmentsToAdd.current.push(courseProf.course_prof_id);
            }

            // If previously marked for deletion, remove it from that list
            enrollmentsToDelete.current = enrollmentsToDelete.current.filter((id) => id !== courseProf.course_prof_id);
        },
        [enrollmentsToAdd]
    );

    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Permission required", "Please allow access to your photos.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets?.length > 0) {
            setImageUri(result.assets[0].uri);
        }
    };

    const updateProfile = async () => {
        if (!user) {
            console.error("No user found");
            return;
        }

        const editedProfile = {
            display_name: fullName,
            major: majorValue,
            pp_url: imageUri,
            year: yearValue,
        };

        try {
            await editProfile(user.id, editedProfile);
            console.log("SAVINFG", enrollmentsToDelete);
            await createEnrollments(user.id, enrollmentsToAdd.current);
            await deleteEnrollments(user.id, enrollmentsToDelete.current);
            router.replace({
                pathname: "/profile",
                params: { refreshKey: Date.now().toString() },
            });
        } catch (e) {
            console.error("Error updating profile", e);
            Alert.alert("Error", "Failed to save your profile.");
        }
    };

    const cancel = () => {
        router.back();
    };

    if (loading) return <LoadingScreen />;

    return (
        <SafeAreaView className="flex-1 bg-colors-background">
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    alignItems: "center",
                    gap: 20,
                    marginTop: 20,
                }}
                showsVerticalScrollIndicator={true}
            >
                <View className="w-full px-6 gap-3">
                    {/* Profile Picture */}
                    <View className="mb-3 items-center">
                        <TouchableOpacity onPress={pickImage}>
                            {imageUri ? (
                                <Image
                                    source={{ uri: imageUri }}
                                    className="w-72 h-72 rounded-full border-2 border-colors-text"
                                />
                            ) : (
                                <View className="w-72 h-72 rounded-full border-2 border-colors-text items-center justify-center">
                                    <Text className="color-colors-textSecondary">Tap to add photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Full Name */}
                    <View>
                        <Text className="mb-2 color-colors-textSecondary">Full Name</Text>
                        <LoginInput
                            placeholder="Full Name"
                            value={fullName}
                            onChangeText={setFullName}
                            placeholderTextColor="darkgray"
                        />
                    </View>

                    {/* Major */}
                    <View style={{ zIndex: 50, elevation: 50 }}>
                        <Text className="mb-2 color-colors-textSecondary">Major</Text>
                        <DropDownPicker
                            key={majorsKey}
                            open={majorOpen}
                            value={majorValue}
                            items={majorOptions}
                            setOpen={setMajorOpen}
                            setValue={setMajorValue}
                            setItems={setMajorOptions}
                            onOpen={handleOpenMajor}
                            onChangeValue={(val) => setMajorValue(val as number | null)}
                            searchable
                            searchPlaceholder="Search Majors"
                            placeholder="Choose Major"
                            placeholderStyle={styles.placeholder}
                            textStyle={{ color: "white", fontSize: 17 }}
                            style={styles.dropdown}
                            dropDownContainerStyle={styles.dropdownContainer}
                            searchContainerStyle={styles.searchContainer}
                            searchTextInputProps={{ style: { color: "white" } }}
                            listMode="SCROLLVIEW"
                        />
                    </View>

                    {/* Year */}
                    <View style={{ zIndex: 40, elevation: 40 }}>
                        <Text className="mb-2 color-colors-textSecondary">Year</Text>
                        <DropDownPicker
                            open={yearOpen}
                            value={yearValue}
                            items={yearOptions}
                            setOpen={setYearOpen}
                            setValue={setYearValue}
                            onOpen={handleOpenYear}
                            onChangeValue={(val) => setYearValue((val as string) ?? null)}
                            placeholder="Choose Grade"
                            placeholderStyle={styles.placeholder}
                            textStyle={{ color: "white", fontSize: 17 }}
                            style={styles.dropdown}
                            dropDownContainerStyle={styles.dropdownContainer}
                            listMode="SCROLLVIEW"
                        />
                    </View>

                    {/* Courses */}
                    <View>
                        <View className="flex flex-row items-center gap-2 mb-2">
                            <Text className=" color-colors-textSecondary">Courses</Text>
                            <TouchableOpacity onPress={chooseCoursesPress}>
                                <Ionicons
                                    size={20}
                                    color={colors.text}
                                    name="add-circle-outline"
                                ></Ionicons>
                            </TouchableOpacity>
                        </View>
                        <View
                            className={`flex ${courses && "flex-row"} justify-center flex-wrap gap-4 min-h-14 border border-colors-text rounded-lg p-2 w-full text-colors-text`}
                        >
                            {!courses || courses.length === 0 ? (
                                <Text className="text-colors-textSecondary text-xl text-left mt-1">No Courses</Text>
                            ) : (
                                courses.map((item: CourseProfDisplay) => (
                                    <View
                                        key={item.course_prof_id}
                                        className="flex flex-row gap-2 items-center bg-colors-secondary p-1 pr-4 rounded-md"
                                    >
                                        <TouchableOpacity
                                            onPress={() => removeCourse(item.course_prof_id, item.enrollmentId)}
                                        >
                                            <Ionicons
                                                size={16}
                                                name="close-circle-outline"
                                                color={colors.primary}
                                            />
                                        </TouchableOpacity>
                                        <View>
                                            <Text className="text-colors-text text-xl text-center">
                                                {item.course_code}
                                            </Text>
                                            <Text className="text-colors-textSecondary text-xl text-center">
                                                {parseLastName(item.prof_name)}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>

                        <CourseSearchModal
                            visible={courseModalVisible}
                            setVisible={setCourseModalVisible}
                            handleProfessorPicked={handleProfessorPicked}
                            selectedCourseProf={courses}
                        />
                    </View>
                    {error && <Text className="color-colors-error text-center">{error}</Text>}
                </View>

                {/* Action Buttons */}
                <View className="flex flex-row justify-center w-3/4 gap-8 mb-10">
                    <RedButton onPress={cancel}>Cancel</RedButton>
                    <BlueButton onPress={updateProfile}>Save Changes</BlueButton>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
    dropdown: {
        backgroundColor: "#002e6d",
        borderColor: "#ffff",
    },
    placeholder: {
        color: "#898989ff",
    },
    dropdownContainer: {
        backgroundColor: "#054eb4ff",
        borderColor: "#ffffff",
    },
    searchContainer: {
        borderColor: "#ffffff",
    },
});
