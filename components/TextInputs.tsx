import React from "react";
import { TextInput, TextInputProps } from "react-native";

export const LoginInput: React.FC<TextInputProps> = ({ ...props }) => {
    return (
        <TextInput
            className="border border-colors-text rounded-lg h-12 pl-2 w-full text-colors-text"
            {...props}
        />
    );
};
