import { LoginButton, RedButton } from "@/components/ui/Buttons";
import { LoginInput } from "@/components/ui/TextInputs";
import { yearOptions } from "@/lib/enumFrontend";
import { useAuth } from "@/services/auth/AuthProvider";
import {
    getAllMajorsForDropdown,
    MajorDropDownItem,
} from "@/services/majorsService";
import { useOnboarding } from "@/services/OnboardingProvider";
import { createProfile } from "@/services/profileService";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
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
    const { setNeedsOnboarding, refresh } = useOnboarding();
    const [fullName, setFullName] = useState("");
    const [yearValue, setYearValue] = useState("");
    const [yearOpen, setYearOpen] = useState(false);
    const [majorOpen, setMajorOpen] = useState(false);
    const [majorValue, setMajorValue] = useState<number | null>(null);
    const [majorOptions, setMajorOptions] = useState<MajorDropDownItem[]>([]); // [{label, value}]
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const handleOpenMajor = () => setYearOpen(false);
    const handleOpenYear = () => setMajorOpen(false);

    // Fetch from supabase the majors
    useEffect(() => {
        //gets all major options
        let mounted = true;
        const getMajors = async () => {
            const majors = await getAllMajorsForDropdown();
            if (mounted) {
                setMajorOptions(majors);
                setLoading(false);
            }
        };

        getMajors();
        return () => {
            mounted = false;
        };
    }, []);

    // Can't proceed unless the text fields are filled
    const validateInputs = () => {
        if (!fullName.trim()) return "Name is required.";
        if (!majorValue) return "Please select a major.";
        if (!yearValue) return "Year is required.";
        if (!imageUri) return "Profile Pic is required";
        return "";
    };

    // Let user pick a profile pic from their phone's gallery
    const pickImage = async () => {
        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert(
                "Permission required",
                "Please allow access to your photos."
            );
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
            Alert.alert(
                "Error",
                "No user was found. Please try to log in again."
            );
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
            await createProfile(newProfile);
            setNeedsOnboarding(false);
            await refresh();

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
            <View className="px-6 py-8 gap-3">
                <View className="flex flex-row justify-center items-center gap-3">
                    <Text className="text-4xl font-bold text-colors-text">
                        Create Your Profile
                    </Text>
                    <Ionicons name="person-circle" color={"#ffff"} size={36} />
                </View>
                <Text className="text-colors-textSecondary text-center">
                    Add your info and profile picture before continuing.
                </Text>
            </View>

            <View className="px-6 gap-3">
                {/*  Profile Picture */}
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
                <View className="z-50">
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
                        textStyle={{ color: "white" }}
                        style={styles.dropdown}
                        dropDownContainerStyle={styles.dropdownContainer}
                        searchContainerStyle={styles.searchContainer}
                        searchTextInputProps={{ color: "white" }}
                    />
                </View>

                <View className="z-40">
                    <DropDownPicker
                        open={yearOpen}
                        onOpen={handleOpenYear}
                        value={yearValue}
                        items={yearOptions}
                        setOpen={setYearOpen}
                        setValue={setYearValue}
                        placeholder="Choose Grade"
                        placeholderStyle={styles.placeholder}
                        textStyle={{ color: "white" }}
                        style={styles.dropdown}
                        dropDownContainerStyle={styles.dropdownContainer}
                    />
                </View>

                {error ? (
                    <Text className="text-colors-error font-semibold mt-2">
                        {error}
                    </Text>
                ) : null}
            </View>

            <View className="flex items-center px-6 mt-6 gap-3">
                <LoginButton
                    bgColor={loading ? "bg-gray-500" : "bg-colors-secondary"}
                    textColor="text-colors-text"
                    onPress={handleCreateProfile}
                >
                    {loading ? <ActivityIndicator /> : "Create Profile"}
                </LoginButton>

                {/* Calls sign out and now it works for me and goes back to the login screen  */}
                <RedButton onPress={handleSignOut}>Sign Out</RedButton>
                <RedButton onPress={() => router.replace("/(app)/(tabs)")}>
                    Go to tabs (for Dev only if you get stuck here)
                </RedButton>
            </View>

            {/* */}
        </SafeAreaView>
    );
}

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
