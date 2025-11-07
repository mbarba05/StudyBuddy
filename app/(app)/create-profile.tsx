import { colors } from "@/assets/colors";
import CourseSearchModal from "@/components/features/courses/CourseSearchModal";
import { LoginButton, RedButton } from "@/components/ui/Buttons";
import { LoginInput } from "@/components/ui/TextInputs";
import { yearOptions } from "@/lib/enumFrontend";
import { parseLastName } from "@/lib/utillities";
import { useAuth } from "@/services/auth/AuthProvider";
import { CourseProfDisplay } from "@/services/courseService";
import { createEnrollments } from "@/services/enrollmentService";
import { getAllMajorsForDropdown, MajorDropDownItem } from "@/services/majorsService";
import { useProfileGate } from "@/services/ProfileProvider";
import { createProfile } from "@/services/profileService";
import { getCurrentAndNextTerm, Term } from "@/services/termsService";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { SafeAreaView } from "react-native-safe-area-context";

// Screen
export default function CreateProfileScreen() {
    const { user, signOut } = useAuth();
    const { refreshProfile } = useProfileGate();
    const [fullName, setFullName] = useState("");
    const [yearValue, setYearValue] = useState("");
    const [yearOpen, setYearOpen] = useState(false);
    const [majorOpen, setMajorOpen] = useState(false);
    const [majorValue, setMajorValue] = useState<number | null>(null);
    const [majorOptions, setMajorOptions] = useState<MajorDropDownItem[]>([]); // [{label, value}]
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [courseModalVisible, setCourseModalVisible] = useState(false);
    const [selectedCourseProf, setSelectedCourseProf] = useState<CourseProfDisplay[]>([]);
    const [currentAndNextTerm, setCurrentAndNextTerm] = useState<[Term, Term] | null>(null);
    const handleOpenMajor = () => setYearOpen(false);
    const handleOpenYear = () => setMajorOpen(false);

    // Fetch from supabase the majors and terms
    useEffect(() => {
        //gets all major options
        let mounted = true;
        const getMajors = async () => {
            const majors = await getAllMajorsForDropdown();
            if (mounted) {
                setMajorOptions(majors);
            }
        };

        const getTerms = async () => {
            const terms = await getCurrentAndNextTerm();
            if (mounted) {
                setCurrentAndNextTerm(terms);
                setLoading(false);
            }
        };
        getMajors();
        getTerms();
        return () => {
            mounted = false;
        };
    }, []);

    const handleProfessorPicked = useCallback((courseProf: CourseProfDisplay) => {
        setSelectedCourseProf((prev) => (prev.includes(courseProf) ? prev : [...prev, courseProf]));
    }, []);

    const chooseCoursesPress = () => {
        if (selectedCourseProf.length >= 6) {
            setError("You can only pick up to 6 courses");
        } else {
            setCourseModalVisible(true);
        }
    };

    const removeCourse = (courseProfId: number) => {
        setSelectedCourseProf((prev) => prev.filter((item) => item.course_prof_id !== courseProfId));
    };

    // Can't proceed unless the text fields are filled
    const validateInputs = () => {
        if (!fullName.trim()) return "Name is required.";
        if (!majorValue) return "Please select a major.";
        if (!yearValue) return "Year is required.";
        if (!imageUri) return "Profile Pic is required";
        if (selectedCourseProf.length === 0) return "Please choose at least one course.";
        return "";
    };

    // Let user pick a profile pic from their phone's gallery
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

    // Create the profile
    const handleCreateProfile = async () => {
        const validationError = validateInputs();
        if (validationError) {
            setError(validationError);
            return;
        }

        if (!user) {
            Alert.alert("Error", "No user was found. Please try to log in again.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const newProfile = {
                userId: user.id,
                displayName: fullName.trim(),
                majorId: majorValue as number,
                year: yearValue,
                ppUrl: imageUri as string,
            };

            const courseProdIds = selectedCourseProf.map((courseProf) => courseProf.course_prof_id);
            await createProfile(newProfile);
            await createEnrollments(user.id, courseProdIds);
            await refreshProfile();

            router.replace("/(app)/(tabs)");
        } catch (e: any) {
            console.error("Error creating profile:", e);
            Alert.alert("Error", e.message || "Failed to create profile.");
        } finally {
            setLoading(false);
        }
    };

    // Spent some time here and make it so it signed out and returned to the login screen
    const handleSignOut = async () => {
        try {
            await signOut();
            router.replace("/(auth)/login");
        } catch (error) {
            console.error("Sign out error:", error);
            Alert.alert("Error", "Unable to sign out. Please try again.");
        }
    };

    // UI like the text and styling
    return (
        <SafeAreaView className="flex-1 bg-colors-background">
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                <ScrollView
                    contentInsetAdjustmentBehavior="automatic" // iOS: safe insets
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 24 }}
                >
                    <View className="px-6 py-8 gap-3">
                        <View className="flex flex-row justify-center items-center gap-3">
                            <Text className="text-4xl font-bold text-colors-text">Create Your Profile</Text>
                            <Ionicons
                                name="person-circle"
                                color={"#ffff"}
                                size={36}
                            />
                        </View>
                        <Text className="text-colors-textSecondary text-center text-xl">
                            Add your info and profile picture before continuing.
                        </Text>
                    </View>

                    <View className="px-6 gap-3">
                        {/* Profile Picture */}
                        <View className="mb-3 items-center">
                            {imageUri ? (
                                <TouchableOpacity onPress={pickImage}>
                                    <Image
                                        source={{ uri: imageUri }}
                                        className="w-72 h-72 rounded-full border-2 border-colors-text"
                                    />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={pickImage}
                                    className="w-72 h-72 rounded-full border-2 border-colors-text flex justify-center items-center mb-4"
                                >
                                    <Ionicons
                                        name="camera"
                                        size={32}
                                        color={"#898989ff"}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>

                        <LoginInput
                            placeholder="Full Name"
                            value={fullName}
                            onChangeText={setFullName}
                            placeholderTextColor="darkgray"
                        />

                        {/* Major Selection */}
                        <View style={{ zIndex: 1000 /* highest */ }}>
                            <DropDownPicker
                                open={majorOpen}
                                value={majorValue}
                                items={majorOptions}
                                onOpen={handleOpenMajor}
                                setOpen={setMajorOpen}
                                setValue={setMajorValue}
                                setItems={setMajorOptions}
                                searchable
                                searchPlaceholder="Search Majors"
                                placeholder="Choose Major"
                                placeholderStyle={styles.placeholder}
                                textStyle={{
                                    color: "white",
                                    fontSize: 17,
                                }}
                                style={styles.dropdown}
                                dropDownContainerStyle={styles.dropdownContainer}
                                searchContainerStyle={styles.searchContainer}
                                searchTextInputProps={{
                                    color: colors.text,
                                    borderColor: colors.text,
                                }}
                                listMode="SCROLLVIEW"
                            />
                        </View>

                        <View style={{ zIndex: 900 }}>
                            <DropDownPicker
                                open={yearOpen}
                                onOpen={handleOpenYear}
                                value={yearValue}
                                items={yearOptions}
                                setOpen={setYearOpen}
                                setValue={setYearValue}
                                placeholder="Choose Grade"
                                placeholderStyle={styles.placeholder}
                                textStyle={{ color: colors.text, fontSize: 17 }}
                                style={styles.dropdown}
                                dropDownContainerStyle={styles.dropdownContainer}
                                listMode="SCROLLVIEW"
                            />
                        </View>

                        <Pressable
                            className={`flex ${selectedCourseProf.length !== 0 && "flex-row"} justify-center flex-wrap gap-4 min-h-14 border border-colors-text rounded-lg p-2 w-full text-colors-text`}
                            onPress={chooseCoursesPress}
                        >
                            {selectedCourseProf.length === 0 ? (
                                <Text className="text-colors-textSecondary text-xl text-left mt-1">
                                    Courses for {currentAndNextTerm && currentAndNextTerm[0].name}
                                </Text>
                            ) : (
                                selectedCourseProf.map((item: CourseProfDisplay) => (
                                    <View
                                        key={item.course_prof_id}
                                        className="flex flex-row gap-2 items-center bg-colors-secondary p-1 pr-4 rounded-md"
                                    >
                                        <TouchableOpacity onPress={() => removeCourse(item.course_prof_id)}>
                                            <Ionicons
                                                size={16}
                                                name="close-circle-outline"
                                                color={colors.primary}
                                            />
                                        </TouchableOpacity>
                                        <View>
                                            <Text className="font-semibold text-colors-text text-xl text-center">
                                                {item.course_code}
                                            </Text>
                                            <Text className="text-colors-textSecondary text-xl text-center">
                                                {parseLastName(item.prof_name)}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </Pressable>

                        <CourseSearchModal
                            visible={courseModalVisible}
                            setVisible={setCourseModalVisible}
                            handleProfessorPicked={handleProfessorPicked}
                            selectedCourseProf={selectedCourseProf}
                        />

                        {error ? <Text className="text-colors-error font-semibold mt-2">{error}</Text> : null}
                    </View>

                    <View className="flex items-center px-6 mt-6 gap-3">
                        <LoginButton
                            bgColor={loading ? "bg-gray-500" : "bg-colors-secondary"}
                            textColor="text-colors-text"
                            onPress={handleCreateProfile}
                        >
                            {loading ? <ActivityIndicator /> : "Create Profile"}
                        </LoginButton>
                        <RedButton onPress={handleSignOut}>Sign Out</RedButton>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    dropdown: {
        backgroundColor: "#002e6d",
        borderColor: colors.text,
    },
    placeholder: {
        color: colors.textSecondary,
    },
    dropdownContainer: {
        backgroundColor: colors.secondary,
        borderColor: colors.text,
    },
    searchContainer: {
        borderColor: colors.text,
    },
});
