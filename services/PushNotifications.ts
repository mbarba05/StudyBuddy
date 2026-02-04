// PushNotifications.ts
export async function sendMatchNotification(targetUserId: string, message: string) {
    try {
        const formattedDate = new Date().toLocaleString(); // current date-time

        const payload = {
            appId: 32675, // your Native Notify appId
            appToken: "HlIdYpxKIL4Hs4fsFJ58co", // your Native Notify appToken
            title: "StudyBuddy",
            body: message,
            dateSent: formattedDate,
            userIds: [targetUserId], // send to specific user
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
        } else {
            console.log(`Notification sent to user ${targetUserId}: ${message}`);
        }
    } catch (error) {
        console.error("Error sending push notification:", error);
    }
}
