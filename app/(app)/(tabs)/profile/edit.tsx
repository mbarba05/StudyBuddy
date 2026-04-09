import { colors } from "@/assets/colors";
import CourseSearchModal from "@/components/features/courses/CourseSearchModal";
import { LoginButton } from "@/components/ui/Buttons";
import { LoadingScreen } from "@/components/ui/Loading";
import { LoginInput } from "@/components/ui/TextInputs";
import { yearOptions } from "@/lib/enumFrontend";
import { parseLastName } from "@/lib/utillities";
import { CourseProfDisplay } from "@/services/courseService";
import { createEnrollments, deleteEnrollments, getEnrollmentsForProfile } from "@/services/enrollmentService";
import { getAllMajorsForDropdown, MajorDropDownItem } from "@/services/majorsService";
import { editProfile, getUserProfile } from "@/services/profileService";
import { getCurrentAndNextTerm, Term } from "@/services/termsService";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

const EditProfileScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [fullName, setFullName] = useState("");
    const [bio, setBio] = useState("");
    const [yearOpen, setYearOpen] = useState(false);
    const [yearValue, setYearValue] = useState<string | null>(null);
    const [majorOpen, setMajorOpen] = useState(false);
    const [majorValue, setMajorValue] = useState<number | null>(null);
    const [majorOptions, setMajorOptions] = useState<MajorDropDownItem[]>([]);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [extraPhotos, setExtraPhotos] = useState<string[]>([]);
    const [currCourses, setCurrCourses] = useState<CourseProfDisplay[] | null>(null);
    const [nextCourses, setNextCourses] = useState<CourseProfDisplay[] | null>(null);
    const [currCourseModalVisible, setCurrCourseModalVisible] = useState(false);
    const [nextCourseModalVisible, setNextCourseModalVisible] = useState(false);
    const [error, setError] = useState("");
    const enrollmentsToDelete = useRef<number[]>([]);
    const currEnrollmentsToAdd = useRef<number[]>([]);
    const nextEnrollmentsToAdd = useRef<number[]>([]);
    const handleOpenMajor = () => setYearOpen(false);
    const handleOpenYear = () => setMajorOpen(false);
    const majorsKey = useMemo(() => `majors-${majorOptions.length || 0}`, [majorOptions.length]);
    const [currAndNextTerm, setCurrAndNextTerm] = useState<[Term, Term] | null>(null);

    useEffect(() => {
        let mounted = true;

        const run = async () => {
            try {
                const [majors, prof, course, terms] = await Promise.all([
                    getAllMajorsForDropdown(),
                    getUserProfile(),
                    getEnrollmentsForProfile(),
                    getCurrentAndNextTerm(),
                ]);

                if (!mounted) return;
                setCurrAndNextTerm(terms);

                const currTermCourses = course?.filter((enrollment) => enrollment.term === terms?.[0].name) || [];
                const nextTermCourses = course?.filter((enrollment) => enrollment.term === terms?.[1].name) || [];
                setCurrCourses(currTermCourses);
                setNextCourses(nextTermCourses);

                const normalizedMajors: MajorDropDownItem[] = (majors || []).map((m) => ({
                    label: m.label,
                    value: Number(m.value),
                }));
                setMajorOptions(normalizedMajors);

                if (prof) {
                    setFullName(prof.display_name ?? "");
                    setImageUri(prof.pp_url ?? null);
                    setYearValue(prof.year ?? null);
                    setExtraPhotos(prof.photo_urls ?? []);
                    setBio(prof.bio ?? "");

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
    }, []);

    const removeCurrCourse = (courseProfId: number, enrollmentId: number) => {
        setCurrCourses((prev) => prev?.filter((item) => item.course_prof_id !== courseProfId) ?? null);
        if (!enrollmentsToDelete.current.includes(enrollmentId)) {
            enrollmentsToDelete.current.push(enrollmentId);
        }
        // If this course was previously queued to add, remove it
        currEnrollmentsToAdd.current = currEnrollmentsToAdd.current.filter((id) => id !== courseProfId);
    };

    const chooseCurrCoursesPress = () => {
        if (currCourses && currCourses.length >= 6) setError("You can only choose 6 courses");
        else {
            setError("");
            setCurrCourseModalVisible(true);
        }
    };

    const handleCurrProfessorPicked = useCallback(
        (courseProf: CourseProfDisplay) => {
            setCurrCourses((prev) =>
                prev?.some((c) => c.course_prof_id === courseProf.course_prof_id)
                    ? prev
                    : [...(prev ?? []), courseProf],
            );

            if (!currEnrollmentsToAdd.current.includes(courseProf.course_prof_id)) {
                currEnrollmentsToAdd.current.push(courseProf.course_prof_id);
            }

            // If previously marked for deletion, remove it from that list
            enrollmentsToDelete.current = enrollmentsToDelete.current.filter((id) => id !== courseProf.course_prof_id);
        },
        [currEnrollmentsToAdd],
    );

    const removeNextCourse = (courseProfId: number, enrollmentId: number) => {
        setNextCourses((prev) => prev?.filter((item) => item.course_prof_id !== courseProfId) ?? null);
        if (!enrollmentsToDelete.current.includes(enrollmentId)) {
            enrollmentsToDelete.current.push(enrollmentId);
        }
        // If this course was previously queued to add, remove it
        currEnrollmentsToAdd.current = currEnrollmentsToAdd.current.filter((id) => id !== courseProfId);
    };

    const chooseNextCoursesPress = () => {
        if (nextCourses && nextCourses.length >= 6) setError("You can only choose 6 courses");
        else {
            setError("");
            setNextCourseModalVisible(true);
        }
    };

    const handleNextProfessorPicked = useCallback(
        (courseProf: CourseProfDisplay) => {
            setNextCourses((prev) =>
                prev?.some((c) => c.course_prof_id === courseProf.course_prof_id)
                    ? prev
                    : [...(prev ?? []), courseProf],
            );

            if (!currEnrollmentsToAdd.current.includes(courseProf.course_prof_id)) {
                currEnrollmentsToAdd.current.push(courseProf.course_prof_id);
            }

            // If previously marked for deletion, remove it from that list
            enrollmentsToDelete.current = enrollmentsToDelete.current.filter((id) => id !== courseProf.course_prof_id);
        },
        [currEnrollmentsToAdd],
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

    const pickExtraPhotos = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Permission required", "Please allow access to your photos.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            orderedSelection: true,
            quality: 0.7,
            selectionLimit: 5,
    });

    if (!result.canceled && result.assets?.length > 0) {
        const newUris = result.assets.map((asset) => asset.uri);
        setExtraPhotos((prev) => [...prev, ...newUris].slice(0, 5));
    }
    };

    const removeExtraPhoto = (uri: string) => {
        setExtraPhotos((prev) => prev.filter((photo) => photo !== uri));
    };

    const updateProfile = async () => {
        const editedProfile = {
            display_name: fullName,
            bio: bio.trim() || null,
            major: majorValue,
            pp_url: imageUri,
            photo_urls: extraPhotos,
            year: yearValue,
        };

        try {
            await editProfile(editedProfile);
            console.log("SAVINFG", enrollmentsToDelete);
            if (currAndNextTerm) {
                await createEnrollments(currEnrollmentsToAdd.current, currAndNextTerm[0].name); //enrollments for current term
                await createEnrollments(nextEnrollmentsToAdd.current, currAndNextTerm[1].name); //enrollments for next term
            } else {
                Alert.alert("Error updating classes", "Could not find current and next term.");
            }

            await deleteEnrollments(enrollmentsToDelete.current);
            router.back();
            router.replace({
                pathname: "/profile",
                params: { refreshKey: Date.now().toString() },
            });
        } catch (e) {
            console.error("Error updating profile", e);
            Alert.alert("Error", "Failed to save your profile.");
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <View className="flex-1 bg-colors-background">
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
                                    className="w-80 h-80 rounded-full border-2 border-colors-text"
                                />
                            ) : (
                                <View className="w-80 h-80 rounded-full border-2 border-colors-text items-center justify-center">
                                    <Text className="color-colors-textSecondary">Tap to add photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                    
                    {/* Extra Photos */}
                    <View>
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="color-colors-textSecondary text-lg">Extra Profile Photos</Text>
                            <TouchableOpacity testID="add-extra-photos-button" onPress={pickExtraPhotos}>
                                <Ionicons name="add-circle-outline" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row flex-wrap gap-3 border border-colors-text rounded-lg p-3 min-h-24">
                            {extraPhotos.length === 0 ? (
                                <Text className="color-colors-textSecondary">No extra photos added yet.</Text>
                            ) : (
                                extraPhotos.map((uri, index) => (
                                    <View key={`${uri}-${index}`} className="relative">
                                        <Image source={{ uri }} className="w-24 h-24 rounded-lg" />
                                        <TouchableOpacity
                                            testID={`remove-extra-photo-${index}`}
                                            onPress={() => removeExtraPhoto(uri)}
                                            className="absolute -top-2 -right-2 bg-colors-background rounded-full"
                                        >
                                            <Ionicons name="close-circle" size={22} color={colors.primary} />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </View>
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

                    <View>
                        <Text className="mb-2 color-colors-textSecondary">Bio</Text>
                        <LoginInput
                            placeholder="Bio (optional)"
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            style={{
                                height: 64,
                            }}
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
                    {/* Curr Courses */}
                    <View>
                        <View className="flex flex-row items-center gap-2 mb-2">
                            <Text className=" color-colors-textSecondary">
                                Current Term Courses ({currAndNextTerm && currAndNextTerm[0].name})
                            </Text>
                            <TouchableOpacity onPress={chooseCurrCoursesPress}>
                                <Ionicons size={20} color={colors.text} name="add-circle-outline"></Ionicons>
                            </TouchableOpacity>
                        </View>
                        <View
                            className={`flex ${
                                currCourses && "flex-row"
                            } justify-center flex-wrap gap-4 min-h-14 border border-colors-text rounded-lg p-2 w-full text-colors-text`}
                        >
                            {!currCourses || currCourses.length === 0 ? (
                                <Text className="text-colors-textSecondary text-xl text-left mt-1">No Courses</Text>
                            ) : (
                                currCourses.map((item: CourseProfDisplay) => (
                                    <View
                                        key={item.course_prof_id}
                                        className="flex flex-row gap-2 items-center bg-colors-secondary p-1 pr-4 rounded-md"
                                    >
                                        <TouchableOpacity
                                            onPress={() =>
                                                removeCurrCourse(item.course_prof_id, item.enrollmentId as number)
                                            }
                                        >
                                            <Ionicons size={16} name="close-circle-outline" color={colors.primary} />
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
                        </View>
                        <CourseSearchModal
                            visible={currCourseModalVisible}
                            setVisible={setCurrCourseModalVisible}
                            handleProfessorPicked={handleCurrProfessorPicked}
                            selectedCourseProf={currCourses ?? []}
                        />
                    </View>

                    {/* Next Courses */}
                    <View>
                        <View className="flex flex-row items-center gap-2 mb-2">
                            <Text className=" color-colors-textSecondary">
                                Next Term Courses ({currAndNextTerm && currAndNextTerm[1].name})
                            </Text>
                            <TouchableOpacity onPress={chooseNextCoursesPress}>
                                <Ionicons size={20} color={colors.text} name="add-circle-outline"></Ionicons>
                            </TouchableOpacity>
                        </View>
                        <View
                            className={`flex ${
                                nextCourses && "flex-row"
                            } justify-center flex-wrap gap-4 min-h-14 border border-colors-text rounded-lg p-2 w-full text-colors-text`}
                        >
                            {!nextCourses || nextCourses.length === 0 ? (
                                <Text className="text-colors-textSecondary text-xl text-left mt-1">No Courses</Text>
                            ) : (
                                nextCourses.map((item: CourseProfDisplay) => (
                                    <View
                                        key={item.course_prof_id}
                                        className="flex flex-row gap-2 items-center bg-colors-secondary p-1 pr-4 rounded-md"
                                    >
                                        <TouchableOpacity
                                            onPress={() =>
                                                removeNextCourse(item.course_prof_id, item.enrollmentId as number)
                                            }
                                        >
                                            <Ionicons size={16} name="close-circle-outline" color={colors.primary} />
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
                        </View>
                        <CourseSearchModal
                            visible={nextCourseModalVisible}
                            setVisible={setNextCourseModalVisible}
                            handleProfessorPicked={handleNextProfessorPicked}
                            selectedCourseProf={nextCourses ?? []}
                        />
                    </View>

                    {error && <Text className="color-colors-error text-center">{error}</Text>}
                </View>

                {/* Action Buttons */}
                <View className="w-full gap-2 p-2">
                    <LoginButton bgColor="bg-colors-secondary" textColor="color-colors-text" onPress={updateProfile}>
                        Save
                    </LoginButton>
                </View>
            </ScrollView>
        </View>
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
