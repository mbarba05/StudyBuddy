import { BlueButton, RedButton } from "@/components/ui/Buttons";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { LoginInput } from "@/components/ui/TextInputs";
import { yearOptions } from "@/lib/enumFrontend";
import { useAuth } from "@/services/auth/AuthProvider";
import {
    getAllMajorsForDropdown,
    MajorDropDownItem,
} from "@/services/majorsService";
import { editProfile, getUserProfile } from "@/services/profileService";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
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
    const handleOpenMajor = () => setYearOpen(false);
    const handleOpenYear = () => setMajorOpen(false);

    //Force a rerender if items load after mount (rare DropDownPicker quirk)
    const majorsKey = useMemo(
        () => `majors-${majorOptions.length || 0}`,
        [majorOptions.length]
    );

    useEffect(() => {
        let mounted = true;

        const run = async () => {
            try {
                if (!user?.id) {
                    if (mounted) setLoading(false);
                    return;
                }

                // Fetch majors and profile together
                const [majors, prof] = await Promise.all([
                    getAllMajorsForDropdown(),
                    getUserProfile(user.id),
                ]);

                if (!mounted) return;

                const normalizedMajors: MajorDropDownItem[] = (
                    majors || []
                ).map((m) => ({
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

                    setMajorValue(
                        Number.isFinite(majorId as number)
                            ? (majorId as number)
                            : null
                    );
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

    const updateProfile = async () => {
        // If imageUri is a local file path, your editProfile implementation
        // should upload it and store the public URL as pp_url.
        const editedProfile = {
            display_name: fullName,
            major: majorValue, // number|null
            pp_url: imageUri,
            year: yearValue, // string|null
        };

        if (!user) {
            console.error("No user found");
            return;
        }

        try {
            await editProfile(user.id, editedProfile);
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
        <SafeAreaView className="flex-1 bg-colors-background items-center gap-10">
            <View className="flex w-full px-6 gap-3">
                {/* Profile Picture */}
                <View className="mb-3 items-center">
                    <TouchableOpacity onPress={pickImage}>
                        {imageUri ? (
                            <Image
                                source={{ uri: imageUri }}
                                className="w-72 h-72 rounded-full border-2 border-colors-text"
                            />
                        ) : (
                            <View
                                className="w-72 h-72 rounded-full border-2 border-colors-text items-center justify-center"
                                style={{
                                    backgroundColor: "rgba(255,255,255,0.06)",
                                }}
                            >
                                <Text className="color-colors-textSecondary">
                                    Tap to add photo
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Full Name */}
                <View>
                    <Text className="mb-2 color-colors-textSecondary">
                        Full Name
                    </Text>
                    <LoginInput
                        placeholder="Full Name"
                        value={fullName}
                        onChangeText={setFullName}
                        placeholderTextColor="darkgray"
                    />
                </View>

                {/* Major Selection */}
                <View style={{ zIndex: 50, elevation: 50 }}>
                    <Text className="mb-2 color-colors-textSecondary">
                        Major
                    </Text>
                    <DropDownPicker
                        key={majorsKey}
                        open={majorOpen}
                        value={majorValue}
                        items={majorOptions}
                        setOpen={setMajorOpen}
                        setValue={setMajorValue}
                        setItems={setMajorOptions}
                        onOpen={handleOpenMajor}
                        onChangeValue={(val) =>
                            setMajorValue(val as number | null)
                        }
                        searchable
                        searchPlaceholder="Search Majors"
                        placeholder="Choose Major"
                        placeholderStyle={styles.placeholder}
                        textStyle={{ color: "white" }}
                        style={styles.dropdown}
                        dropDownContainerStyle={styles.dropdownContainer}
                        searchContainerStyle={styles.searchContainer}
                        searchTextInputProps={{ style: { color: "white" } }}
                        // If you still suspect overlay issues, temporarily enable:
                        // listMode="MODAL"
                    />
                </View>

                {/* Year Selection */}
                <View style={{ zIndex: 40, elevation: 40 }}>
                    <Text className="mb-2 color-colors-textSecondary">
                        Year
                    </Text>
                    <DropDownPicker
                        open={yearOpen}
                        value={yearValue}
                        items={yearOptions}
                        setOpen={setYearOpen}
                        setValue={setYearValue}
                        onOpen={handleOpenYear}
                        onChangeValue={(val) =>
                            setYearValue((val as string) ?? null)
                        }
                        placeholder="Choose Grade"
                        placeholderStyle={styles.placeholder}
                        textStyle={{ color: "white" }}
                        style={styles.dropdown}
                        dropDownContainerStyle={styles.dropdownContainer}
                        // listMode="MODAL"
                    />
                </View>
            </View>

            <BlueButton onPress={updateProfile}>Save Changes</BlueButton>
            <RedButton onPress={cancel}>Cancel</RedButton>
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
