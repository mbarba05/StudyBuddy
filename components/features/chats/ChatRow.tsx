import { colors } from "@/assets/colors";
import { formatTime } from "@/lib/utillities";
import { Chat } from "@/services/messageService";
import { View } from "react-native";
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle } from "react-native-reanimated";
import AttachmentImages from "./AttachmentImage";
import ChatBubble from "./ChatBubble";

export default function ChatRow({
    item,
    isOwn,
    globalX,
}: {
    item: Chat;
    isOwn: boolean;
    globalX: SharedValue<number>;
}) {
    const revealOpacityStyle = useAnimatedStyle(() => {
        // globalX: 0 -> hidden, -MAX_REVEAL -> fully visible
        const opacity = interpolate(globalX.value, [0, -60], [0, 1], Extrapolation.CLAMP);
        return { opacity };
    });

    const slideContentStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: globalX.value }],
    }));

    return (
        <>
            {/* Underlay timestamp on the right (revealed when content slides left) */}
            <View
                style={{ position: "absolute", right: 0, top: 0, bottom: 0, justifyContent: "center" }}
                pointerEvents="none"
            >
                <Animated.Text
                    style={[{ fontSize: 12, opacity: 0.7, color: colors.textSecondary }, revealOpacityStyle]}
                >
                    {formatTime(item.created_at)}
                </Animated.Text>
            </View>

            {/* Foreground content slides left together */}
            <Animated.View style={slideContentStyle}>
                <View className={`${isOwn ? "items-end" : "items-start"}`}>
                    {item.attachments?.length > 0 && <AttachmentImages attachments={item.attachments} />}
                    {item.content && <ChatBubble isOwn={isOwn}>{item.content}</ChatBubble>}
                </View>
            </Animated.View>
        </>
    );
}
