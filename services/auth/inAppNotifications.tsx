import React, { createContext, useContext, useEffect, useState } from "react";
import supabase from "../../lib/supabase";
import { useAuth } from "./AuthProvider";

type Notification = {
    id: string;
    message: string;
    type: "friend_request" | "friend_added";
};

type NotificationContextType = {
    currentNotification: Notification | null;
    clearNotification: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const InAppNotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();

    const [queue, setQueue] = useState<Notification[]>([]);
    const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);

    const processQueue = () => {
        setQueue((prevQueue) => {
            if (prevQueue.length === 0) return prevQueue;

            const next = prevQueue[0];
            setCurrentNotification(next);

            return prevQueue.slice(1);
        });
    };

    const clearNotification = () => {
        setCurrentNotification(null);
    };

    const addNotification = (notification: Notification) => {
        setQueue((prev) => {
            // prevent duplicates
            if (prev.some((n) => n.id === notification.id) || currentNotification?.id === notification.id) {
                return prev;
            }
            return [...prev, notification];
        });
    };

    // Handle showing next notification
    useEffect(() => {
        if (!currentNotification && queue.length > 0) {
            processQueue();
        }
    }, [queue, currentNotification]);

    // Notifications disappear after about 6 seconds
    useEffect(() => {
        if (!currentNotification) return;

        const timer = setTimeout(() => {
            clearNotification();
        }, 6000);

        return () => clearTimeout(timer);
    }, [currentNotification]);

    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel(`notifications:${user.id}`)

            // Friend Request
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "friend_requests",
                    filter: `receiver_id=eq.${user.id}`,
                },
                (payload) => {
                    addNotification({
                        id: payload.new.id,
                        message: `${payload.new.sender_name} sent you a friend request`,
                        type: "friend_request",
                    });
                },
            )

            // Friend Added
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "friends",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    addNotification({
                        id: payload.new.id,
                        message: "You are now friends!",
                        type: "friend_added",
                    });
                },
            )

            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    return (
        <NotificationContext.Provider value={{ currentNotification, clearNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useInAppNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error("useInAppNotifications must be used inside InAppNotificationProvider");
    return context;
};
