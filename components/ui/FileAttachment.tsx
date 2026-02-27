import { colors } from "@/assets/colors";
import { fileNameFromPath, getAttachmentSignedUrlCached } from "@/services/messageService";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";

const FileAttachment = ({ path, mime_type }: { path: string; mime_type?: string }) => {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const signed = await getAttachmentSignedUrlCached(path);
            if (!cancelled) setUrl(signed);
        })();

        return () => {
            cancelled = true;
        };
    }, [path]);

    const filename = fileNameFromPath(path);

    return (
        <Pressable disabled={!url} onPress={() => url && Linking.openURL(url)} style={{ opacity: url ? 1 : 0.6 }}>
            <View className="flex flex-col items-center gap-3 p-3 rounded-xl bg-colors-card w-fit">
                <Ionicons name="document-text-outline" size={100} color={colors.text} />
                <Text numberOfLines={1} className="text-colors-text font-semibold">
                    {filename}
                </Text>
            </View>
        </Pressable>
    );
};

export default FileAttachment;
