import { useCallback, useState } from "react";

export type InAppNotification = {
    type: "friend_request" | "friend_added" | "chat_message";
    message: string;
    conversationId?: string;
};

let _setNotification: ((n: InAppNotification | null) => void) | null = null;

export function triggerInAppNotification(notification: InAppNotification) {
    _setNotification?.(notification);
}

export function useInAppNotifications() {
    const [currentNotification, setCurrentNotification] = useState<InAppNotification | null>(null);

    _setNotification = setCurrentNotification;

    const clearNotification = useCallback(() => {
        setCurrentNotification(null);
    }, []);

    return { currentNotification, clearNotification };
}
