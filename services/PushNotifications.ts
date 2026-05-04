const sanitizeForLog = (input: string): string => {
    return input.replace(/[\r\n]/g, "");
};
// Register device for push notifications and save token to Supabase
export async function registerForPushNotifications(userId: string) {
    if (!Device.isDevice) {
        alert("Must use a physical device for Push Notifications");
        return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        alert("Permission not granted!");
        return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    const pushToken = tokenData.data;
    console.log("Push Token:", pushToken);
    console.log("User ID:", userId);

type PushNotificationType = "friend_request" | "friend_added" | "chat_message";

export const sendPushNotification = async (
    receiverId: string,
    message: string,
    type: PushNotificationType = "chat_message",
    conversationId?: string,
): Promise<boolean> => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase configuration");
        return false;
    }

    try {
        const url = new URL(`${supabaseUrl}/functions/v1/send-notification`);

        if (!url.hostname.endsWith(".supabase.co")) {
            console.error("Invalid Supabase URL");
            return false;
        }

        const response = await fetch(url.toString(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
                receiverId,
                message,
                type,
                conversationId,
            }),
        });

        if (!response.ok) {
            console.error("Failed to send push notification", response.statusText);
            return false;
        }

        console.log(`Notification sent to user ${sanitizeForLog(receiverId)}`);
        return true;
    } catch (error) {
        console.error("Error sending push notification");
        return false;
    }
};

export const sendFriendRequestNotification = async (receiverId: string, senderName: string): Promise<boolean> => {
    return sendPushNotification(receiverId, `${senderName} has sent you a friend request`, "friend_request");
};

export const sendFriendAcceptedNotification = async (receiverId: string, friendName: string): Promise<boolean> => {
    return sendPushNotification(receiverId, `${friendName} has accepted your friend request`, "friend_added");
};

export const sendChatMessageNotification = async (
    receiverId: string,
    senderName: string,
    conversationId: string,
): Promise<boolean> => {
    return sendPushNotification(receiverId, `${senderName} sent you a message`, "chat_message", conversationId);
};
