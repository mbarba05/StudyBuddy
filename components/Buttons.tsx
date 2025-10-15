import React from "react";
import { Pressable, PressableProps, Text } from "react-native";

interface LoginButtonProps extends PressableProps {
    children: React.ReactNode;
    image?: React.ReactNode;
}

export const LoginButton: React.FC<LoginButtonProps> = ({
    children,
    image,
    ...props
}) => {
    return (
        <Pressable
            className="flex flex-row gap-3 bg-colors-text items-center justify-center w-full h-12 rounded-sm"
            {...props}
        >
            {image}
            <Text className="flex flex-row items-center justify-center text-colors-black">
                {children}
            </Text>
        </Pressable>
    );
};
