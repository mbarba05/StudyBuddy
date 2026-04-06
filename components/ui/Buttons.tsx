import { colors } from "@/assets/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, TouchableOpacityProps } from "react-native";

interface GenericButtonProps extends TouchableOpacityProps {
    children: React.ReactNode;
}

interface ClassFilterButtonProps extends GenericButtonProps {
    selected?: boolean;
}

interface LoginButtonProps extends TouchableOpacityProps {
    children: React.ReactNode;
    image?: React.ReactNode;
    textColor?: string;
    bgColor?: string;
}

interface HeaderButtonProps extends TouchableOpacityProps {
    text?: string;
    iconName?: keyof typeof Ionicons.glyphMap;
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
            className={`${bgColor}  flex flex-row gap-3 items-center justify-center w-full h-12 rounded-lg`}
            {...props}
        >
            {image}
            <Text className={`flex flex-row items-center justify-center ${textColor}`}>{children}</Text>
        </TouchableOpacity>
    );
};

export const RedButton: React.FC<GenericButtonProps> = ({ children, ...props }) => {
    return (
        <TouchableOpacity
            className="flex flex-row gap-3 bg-colors-primary items-center justify-center w-32 h-12 rounded-lg"
            {...props}
        >
            <Text className="flex flex-row items-center justify-center text-colors-text font-semibold">{children}</Text>
        </TouchableOpacity>
    );
};

export const BlueButton: React.FC<GenericButtonProps> = ({ children, ...props }) => {
    return (
        <TouchableOpacity
            className="flex flex-row gap-3 bg-colors-secondary items-center justify-center w-32 h-12 rounded-lg"
            {...props}
        >
            <Text className="flex flex-row items-center justify-center text-colors-text font-semibold">{children}</Text>
        </TouchableOpacity>
    );
};

export const ClassFilterButton: React.FC<ClassFilterButtonProps> = ({ selected, children, ...props }) => {
    return (
        <TouchableOpacity
            className={`flex justify-center items-center h-12 px-4 rounded-lg ${selected ? "bg-colors-secondary" : "bg-colors-primary"}`}
            {...props}
        >
            <Text className="text-colors-text font-semibold text-2xl">{children}</Text>
        </TouchableOpacity>
    );
};

export const HeaderButton: React.FC<HeaderButtonProps> = ({ text, iconName, children, ...props }) => {
    return (
        <TouchableOpacity className="flex flex-row items-center" {...props}>
            {text && <Text className="color-colors-text text-lg font-medium px-2">{text}</Text>}
            {iconName && <Ionicons size={20} color={colors.text} name={iconName} />}
        </TouchableOpacity>
    );
};
