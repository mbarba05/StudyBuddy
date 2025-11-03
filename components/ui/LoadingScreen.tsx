import React from "react";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LoadingScreen = () => {
    return (
        <SafeAreaView className="flex-1 bg-colors-background items-center justify-center">
            <ActivityIndicator size={"large"} color="#fff" />
        </SafeAreaView>
    );
};

export default LoadingScreen;
