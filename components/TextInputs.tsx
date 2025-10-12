import React from "react";
import { TextInput } from "react-native";

export const LoginInput = ({ ...props }) => {
    return (
        <TextInput
            className="border border-1 rounded-lg h-12 my-2 pl-4 w-72"
            {...props}
        />
    );
};
