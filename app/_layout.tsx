import InAppNotificationBanner from "@/components/inAppNotificationsBanner";
import { AuthProvider } from "@/services/auth/AuthProvider";
import { InAppNotificationProvider } from "@/services/auth/inAppNotifications";
import { ProfileProvider } from "@/services/ProfileProvider";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-get-random-values";
import "./global.css";

export default function RootLayout() {
    return (
        <AuthProvider>
            <ProfileProvider>
                <GestureHandlerRootView>
                    <StatusBar style="light" />
                    <InAppNotificationProvider>
                        <ActionSheetProvider>
                            <>
                                <Slot />
                                <InAppNotificationBanner />
                            </>
                        </ActionSheetProvider>
                    </InAppNotificationProvider>
                </GestureHandlerRootView>
            </ProfileProvider>
        </AuthProvider>
    );
}
