import React from "react";
import { Pressable, Text } from "react-native";

export const LoginButton = ({ children, ...props }) => {
    return (
        <Pressable
            className="flex items-center justify-center w-full h-12 border rounded-sm"
            {...props}
        >
            <Text>{children}</Text>
        </Pressable>
    );
};
