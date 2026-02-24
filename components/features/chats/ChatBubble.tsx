import React from "react";
import { Text, View } from "react-native";

type ChatBubbleProps = {
    children: string;
    isOwn: boolean;
};

const ChatBubble = ({ children, isOwn }: ChatBubbleProps) => {
    return (
        <View className={`${isOwn ? "bg-colors-secondary" : "bg-colors-textSecondary"} max-w-[70%] p-3  rounded-xl`}>
            <Text className="text-colors-text">{children}</Text>
        </View>
    );
};

export default ChatBubble;
