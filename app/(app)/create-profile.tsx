import { RedButton } from "@/components/ui/Buttons";
import { useAuth } from "@/services/auth/AuthProvider";
import React from "react";
import { Text, View } from "react-native";

const CreateProfileScreen = () => {
    const { signOut } = useAuth();
    return (
        <View>
            <Text>CreateProfileScreen</Text>
            <RedButton onPress={signOut}>Sign Out</RedButton>
        </View>
    );
};

export default CreateProfileScreen;
