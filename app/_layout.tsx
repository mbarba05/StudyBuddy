import { AuthProvider } from "@/services/auth/AuthProvider";
import { ProfileProvider } from "@/services/ProfileProvider";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-get-random-values";
import "./global.css";
//gonna have to deal with this error, if it bothers you,
//its something to do with css files not being recognized

export default function RootLayout() {
    return (
        <AuthProvider>
            <ProfileProvider>
                <StatusBar style="light" />
                <Slot />
            </ProfileProvider>
        </AuthProvider>
    );
}
