import { colors } from "@/assets/colors";
import { ResizeImage } from "@/components/ui/ResizeImage";
import { useAuth } from "@/services/auth/AuthProvider";
import { Chat, ChatAttachment, isImagePickerAsset, sendMessage } from "@/services/messageService";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { v4 as uuidv4 } from "uuid";

type SendTextInputProps = {
    convId: string;
    setChatsById: React.Dispatch<React.SetStateAction<Record<string, Chat>>>;
    setOrder: React.Dispatch<React.SetStateAction<string[]>>;
};

const SendTextInput = ({ convId, setChatsById, setOrder }: SendTextInputProps) => {
    const [message, setMessage] = useState<string>("");
    const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
    const user = useAuth();
    const { showActionSheetWithOptions } = useActionSheet();

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
            attachments: [],
            count: 0,
        };

        // setChatsById((prev) => ({ ...prev, [messageToSend.id]: messageToSend }));
        // setOrder((prev) => [messageToSend.id, ...prev]);
        const error = await sendMessage(messageToSend.id, message, convId, attachments);

        setMessage("");
        setAttachments([]);

        if (error) {
            // rollback or mark failed
            //setChats((prev) => prev.filter((m) => m.id !== messageToSend.id));
            // optionally restore input text or show toast
            return;
        }
    };

    const openAttachmentOptions = () => {
        const options = ["Photo Library", "Camera", "Files", "Cancel"];
        const cancelButtonIndex = 3;
        showActionSheetWithOptions({ options, cancelButtonIndex, title: "Add Attachment" }, async (selectedIndex) => {
            if (selectedIndex === 0) {
                //open photo library
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permission.granted) {
                    Alert.alert("Permission required", "Please allow access to your photos.");
                    return;
                }

                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ["images", "videos", "livePhotos"],
                    aspect: [1, 1],
                    allowsMultipleSelection: true,
                    orderedSelection: true,
                    selectionLimit: 10,
                    videoMaxDuration: 180,
                    quality: 0.7,
                });
                console.log("RESULT", result);

                if (!result.canceled && result.assets?.length > 0) {
                    setAttachments((prev) => [...prev, ...result.assets.map((a) => a)]);
                }
            } else if (selectedIndex === 1) {
                //camera
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (!permission.granted) {
                    Alert.alert("Permission required", "Please allow access to your camera.");
                    return;
                }

                const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ["images", "videos"],
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.7,
                });

                if (!result.canceled && result.assets?.length > 0) {
                    setAttachments((prev) => [...prev, ...result.assets.map((a) => a)]);
                }
            } else if (selectedIndex === 2) {
                //documents
                const result = await DocumentPicker.getDocumentAsync({
                    type: "*/*",
                    copyToCacheDirectory: true,
                });
                console.log("RESULT", result);
                if (!result.canceled && result.assets?.length > 0) {
                    setAttachments((prev) => [...prev, ...result.assets.map((a) => a)]);
                }
            }
        });
    };

    return (
        <View className="flex">
            {attachments.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="w-full h-40 p-2 border-t border-colors-textSecondary mb-1"
                    contentContainerStyle={{
                        gap: 16,
                        justifyContent: "center",
                        flexDirection: "row",
                    }}
                >
                    {attachments.map((att, key) => {
                        console.log("att", isImagePickerAsset(att));
                        return (
                            <View key={key} className="relative">
                                <Ionicons
                                    name="close-circle"
                                    size={20}
                                    color={colors.textSecondary}
                                    className="absolute -right-3 -top-3 z-10"
                                    onPress={() => setAttachments((prev) => prev.filter((_, index) => index !== key))}
                                />

                                {isImagePickerAsset(att) ? (
                                    <ResizeImage width={56} url={att.uri} />
                                ) : (
                                    <View className="h-24 w-24 rounded-lg bg-gray-200 items-center justify-center">
                                        <Ionicons name="document" size={32} color="gray" />
                                        <Text>{att.name}</Text>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>
            )}

            <View className="flex items-center flex-row gap-2 px-2 pb-2">
                <Ionicons name="add-circle" color={colors.secondary} size={36} onPress={openAttachmentOptions} />

                <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Message"
                    placeholderTextColor={colors.textSecondary}
                    className="flex-1 justify-center text-colors-text rounded-2xl px-2 border-colors-textSecondary border h-12"
                />

                {message.length > 0 || attachments.length > 0 ? (
                    <Ionicons name="arrow-up-circle" color={colors.secondary} size={36} onPress={sendText} />
                ) : (
                    <Ionicons name="arrow-up-circle-outline" color={colors.textSecondary} size={36} />
                )}
            </View>
        </View>
    );
};

export default SendTextInput;
