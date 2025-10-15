import React from "react";
import { TextInput } from "react-native";

export const LoginInput = ({ ...props }) => {
    return (
        <TextInput
            className="border border-1 rounded-lg h-12 pl-2 w-72 text-colors-text"
            {...props}
        />
    );
};
