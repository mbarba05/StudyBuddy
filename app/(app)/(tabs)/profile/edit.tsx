import React from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EditProfileScreen = () => {
    const updateProfile = async () => {
        //make an update profile function in profile service
    };

    return (
        <SafeAreaView className="flex-1 bg-colors-background items-center justify-between">
            <Text>Edit Profile</Text>
        </SafeAreaView>
    );
};

export default EditProfileScreen;
