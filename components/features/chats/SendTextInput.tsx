import { colors } from "@/assets/colors";
import { useAuth } from "@/services/auth/AuthProvider";
import { Chat, sendMessage } from "@/services/messageService";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { TextInput, View } from "react-native";
import { v4 as uuidv4 } from "uuid";

type SendTextInputProps = {
    convId: string;
    setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
};

const SendTextInput = ({ convId, setChats }: SendTextInputProps) => {
    const [message, setMessage] = useState<string>("");
    const user = useAuth();

    const sendText = async () => {
        if (!user.user?.id) {
            console.error("Auth error when sending text");
            return;
        }

        const clientId = uuidv4();

        const messageToSend: Chat = {
            // optimistically create message and update state on the client to avoid waiting a secnod for ui to update after send
            id: clientId,
            sender_id: user.user?.id,
            content: message,
            conversation_id: convId,
            created_at: "now",
        };

        setChats((prev) => [messageToSend, ...prev]);
        const error = await sendMessage(messageToSend.id, message, convId);

        setMessage("");

        if (error) {
            // 5) rollback or mark failed
            setChats((prev) => prev.filter((m) => m.id !== messageToSend.id));
            // optionally restore input text or show toast
            return;
        }
    };

    return (
        <View className="flex items-centerr flex-row gap-2 px-2 pb-2">
            <Ionicons
                name="add-circle"
                color={colors.secondary}
                size={36}
            />
            <TextInput
                value={message}
                onChangeText={(e) => setMessage(e)}
                placeholder="Message"
                placeholderTextColor={colors.textSecondary}
                className="flex-1 text-colors-text rounded-2xl px-2 border-colors-textSecondary border-2 h-12"
            ></TextInput>
            {message ? (
                <Ionicons
                    name="arrow-up-circle"
                    color={colors.secondary}
                    size={36}
                    onPress={sendText}
                />
            ) : (
                <Ionicons
                    name="arrow-up-circle-outline"
                    color={colors.textSecondary}
                    size={36}
                />
            )}
        </View>
    );
};

export default SendTextInput;
