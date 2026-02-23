// PushNotifications.ts
const sanitizeForLog = (input: string): string => {
    return input.replace(/[\r\n]/g, "");
};

export async function sendMatchNotification(targetUserId: string, message: string): Promise<boolean> {
    const appId = process.env.EXPO_PUBLIC_NATIVE_NOTIFY_APP_ID;
    const appToken = process.env.EXPO_PUBLIC_NATIVE_NOTIFY_APP_TOKEN;

    if (!appId || !appToken) {
        console.error("Missing Native Notify configuration");
        return false;
    }

    try {
        const formattedDate = new Date().toLocaleString();

        const payload = {
            appId: parseInt(appId),
            appToken,
            title: "StudyBuddy",
            body: message,
            dateSent: formattedDate,
            userIds: [targetUserId],
        };

        const response = await fetch("https://app.nativenotify.com/api/notification", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error("Failed to send push notification", response.statusText);
            return false;
        }
        console.log(`Notification sent to user ${sanitizeForLog(targetUserId)}`);
        return true;
    } catch (error) {
        console.error("Error sending push notification");
        return false;
    }
}

export const sendPushNotification = async (receiverId: string, message: string): Promise<boolean> => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase configuration");
        return false;
    }

    try {
        const url = new URL(`${supabaseUrl}/functions/v1/new-message-notify`);
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
                userId: receiverId,
                body: message,
            }),
        });

        if (!response.ok) {
            console.error("Failed to send push notification", response.statusText);
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error sending push notification");
        return false;
    }
};
