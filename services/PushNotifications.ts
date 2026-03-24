// PushNotifications.ts
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

const supabase = createClient(
    "https://dljsmpqvqzcovvbddugh.supabase.co",
    "sb_publishable_NYTMX9_6Gdbm5vAlPXdL5g_CWzw5afw",
);

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

    // Save token in Supabase profiles table
    const { error } = await supabase.from("profiles").update({ push_token: pushToken }).eq("user_id", userId);

    if (error) console.error("Error saving push token:", error.message);
    else console.log(`Push token saved for user ${userId}: ${pushToken}`);

    return pushToken;
}

// Send match notification
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

// Send message notification via Supabase Edge Function
export const sendPushNotification = async () => {
    console.log("sendPushNotification disabled (using Native Notify instead)");
    return true;
};
