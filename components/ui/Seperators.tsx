import { Text, View } from "react-native";

interface TextSeparatorProps {
    text: string;
}

export const TextSeparator = ({ text }: TextSeparatorProps) => {
    return (
        <View className="flex-row items-center my-4">
            <View className="flex-1 h-[1px] bg-colors-textSecondary" />
            <Text className="mx-3 text-colors-textSecondary font-medium">
                {text}
            </Text>
            <View className="flex-1 h-[1px] bg-colors-textSecondary" />
        </View>
    );
};
