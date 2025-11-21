import { colors } from "@/assets/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TextInput, TextInputProps, View } from "react-native";

export const LoginInput = (props: TextInputProps) => {
    return (
        <TextInput
            className="border border-colors-text text-xl rounded-lg h-14 pl-2 pb-2 w-full text-colors-text"
            placeholderTextColor={colors.textSecondary}
            {...props}
        />
    );
};

export const SearchBar = (props: TextInputProps) => {
    return (
        <View className="flex flex-row items-center border border-colors-text rounded-lg h-14 pl-2 w-full text-colors-text">
            <Ionicons
                name="search"
                size={28}
                color="#fff"
            />
            <TextInput
                {...props}
                placeholderTextColor={colors.textSecondary}
                className="w-full ml-2 text-colors-text text-xl"
            />
        </View>
    );
};

export const ReviewInput = (props: TextInputProps) => {
    return (
        <TextInput
            {...props}
            placeholderTextColor={colors.textSecondary}
            className="border border-colors-text text-lg rounded-lg h-32 p-2 w-full text-colors-text"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
        />
    );
};
