import React from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const LoadingScreen = () => {
    return (
        <SafeAreaView className="flex-1 bg-colors-background items-center justify-center">
            <ActivityIndicator size={"large"} color="#fff" />
        </SafeAreaView>
    );
};

export const LoadingRightHeader = () => {
    return (
        <View className="flex items-center justify-center pl-2.5">
            <ActivityIndicator />
        </View>
    );
};
