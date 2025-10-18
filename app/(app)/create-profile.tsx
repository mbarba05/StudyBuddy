import { RedButton } from "@/components/ui/Buttons";
import { useAuth } from "@/services/auth/AuthProvider";
import React from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CreateProfileScreen = () => {
    const { signOut } = useAuth();
    return (
        <SafeAreaView className="flex-1 bg-colors-background">
            <Text>CreateProfileScreen</Text>
            <RedButton onPress={signOut}>Sign Out</RedButton>
        </SafeAreaView>
    );
};

export default CreateProfileScreen;
