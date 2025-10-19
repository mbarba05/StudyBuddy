import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { LoginInput } from "@/components/ui/TextInputs";
import { LoginButton, RedButton } from "@/components/ui/Buttons";
import { useAuth } from "@/services/auth/AuthProvider";
import { createProfile } from "@/services/profileService"; // ✅ named import
import supabase from "@/lib/subapase"; // ✅ default import (matches your filename)
import { router } from "expo-router";


// Screen 
export default function CreateProfileScreen() {
  const { user, signOut } = useAuth();

  // useState initalizations 
  const [fullName, setFullName] = useState("");
  const [year, setYear] = useState("");
  const [majorId, setMajorId] = useState<number | null>(null);
  const [majors, setMajors] = useState<{ id: number; name: string }[]>([]);
  const [majorModalVisible, setMajorModalVisible] = useState(false);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch from supabase the majors 
  useEffect(() => {
    const fetchMajors = async () => {
      const { data, error } = await supabase
        .from("majors")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching majors:", error);
      } else {
        setMajors(data || []);
      }
    };

    fetchMajors();
  }, []);

  // Can't proceed unless the text fields are filled
  const validateInputs = () => {
    if (!fullName.trim()) return "Full name is required.";
    if (!majorId) return "Please select a major.";
    if (!year.trim()) return "Year is required.";
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

  // Upload the user profile pic images to supabase 
  const uploadImage = async (fileUri: string, userId: string) => {
    try {
      setUploading(true);
      const response = await fetch(fileUri);
      const blob = await response.blob();
      const fileExt = fileUri.split(".").pop();
      const fileName = `${userId}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error: any) {
      console.error("Error uploading image: ", error);
      Alert.alert("Error", "Failed to upload image to Supa.");
      return null;
    } finally {
      setUploading(false);
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

      let imageUrl: string | null = null;
      if (imageUri) {
        imageUrl = await uploadImage(imageUri, user.id);
      }

      const newProfile = {
        userId: user.id,
        displayName: fullName.trim(),
        majorId: majorId!,
        year: year.trim(),
        ppUrl: imageUrl || null,
      };

      await createProfile(newProfile);



      Alert.alert("Success", "Your profile has been created!");
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
        <Text className="text-3xl font-bold text-colors-text">
          Create Your Profile
        </Text>
        <Text className="text-colors-textSecondary">
          Add your info and profile picture before continuing.
        </Text>
      </View>

      <View className="px-6 gap-3">
        <LoginInput
          placeholder="Full Name *"
          value={fullName}
          onChangeText={setFullName}
          placeholderTextColor="darkgray"
        />

        {/* Major Selection */}
        <TouchableOpacity
          onPress={() => setMajorModalVisible(true)}
          style={{
            backgroundColor: "#1E1E1E",
            borderRadius: 8,
            paddingVertical: 14,
            paddingHorizontal: 12,
          }}
        >
          <Text
            style={{
              color: majorId ? "white" : "gray",
              fontSize: 16,
            }}
          >
            {majorId
              ? majors.find((m) => m.id === majorId)?.name
              : "Select Major *"}
          </Text>
        </TouchableOpacity>

        <LoginInput
          placeholder="Year (Freshman, Sophomore, Junior, Senior) *"
          value={year}
          onChangeText={setYear}
          placeholderTextColor="darkgray"
        />

        {/*  Profile Picture */}
        <View className="mt-3 items-center">
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                marginBottom: 10,
              }}
            />
          ) : (
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 2,
                borderColor: "#555",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <Text style={{ color: "#777" }}>No Image</Text>
            </View>
          )}
          <LoginButton
            bgColor="bg-gray-700"
            textColor="text-colors-text"
            onPress={pickImage}
          >
            {uploading ? <ActivityIndicator /> : "Select Photo"}
          </LoginButton>
        </View>

        {error ? (
          <Text className="text-colors-error font-semibold mt-2">{error}</Text>
        ) : null}
      </View>

      <View className="px-6 mt-6 gap-3">
        <LoginButton
          bgColor={loading ? "bg-gray-500" : "bg-colors-primary"}
          textColor="text-colors-text"
          onPress={handleCreateProfile}
        >
          {loading ? <ActivityIndicator /> : "Create Profile"}
        </LoginButton>

        {/* Calls sign out and now it works for me and goes back to the login screen  */}
        <RedButton onPress={handleSignOut}>Sign Out</RedButton>
      </View>

      {/* */}
      <Modal visible={majorModalVisible} animationType="slide">
        <SafeAreaView className="flex-1 bg-colors-background">
          <View className="px-6 py-4">
            <Text className="text-2xl font-bold text-colors-text">
              Select Your Major
            </Text>
          </View>
          <FlatList
            data={majors}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setMajorId(item.id);
                  setMajorModalVisible(false);
                }}
                style={{
                  padding: 16,
                  borderBottomWidth: 1,
                  borderColor: "#333",
                }}
              >
                <Text className="text-colors-text">{item.name}</Text>
              </TouchableOpacity>
            )}
          />
          <View className="px-6 py-4">
            <RedButton onPress={() => setMajorModalVisible(false)}>
              Cancel
            </RedButton>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
