import React from "react";
import { Text, TouchableOpacity, TouchableOpacityProps } from "react-native";

interface GenericButtonProps extends TouchableOpacityProps {
    children: React.ReactNode;
}

interface LoginButtonProps extends TouchableOpacityProps {
    children: React.ReactNode;
    image?: React.ReactNode;
    textColor?: string;
    bgColor?: string;
}

export const LoginButton: React.FC<LoginButtonProps> = ({
    children,
    image,
    bgColor = "bg-colors-text",
    textColor = "text-colors-black",
    ...props
}) => {
    return (
        <TouchableOpacity
            className={`${bgColor} flex flex-row gap-3 items-center justify-center w-full h-12 rounded-sm`}
            {...props}
        >
            {image}
            <Text
                className={`flex flex-row items-center justify-center ${textColor}`}
            >
                {children}
            </Text>
        </TouchableOpacity>
    );
};

export const RedButton: React.FC<GenericButtonProps> = ({
    children,
    ...props
}) => {
    return (
        <TouchableOpacity
            className="flex flex-row gap-3 bg-colors-primary items-center justify-center w-1/2 h-12 rounded-sm"
            {...props}
        >
            <Text className="flex flex-row items-center justify-center text-colors-text">
                {children}
            </Text>
        </TouchableOpacity>
    );
};
