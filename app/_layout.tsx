import { AuthProvider } from "@/auth/AuthProvider";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "./global.css";
//gonna have to deal with this error, if it bothers you,
//its something to do with css files not being recognized

export default function RootLayout() {
    return (
        <AuthProvider>
            <StatusBar style="auto" />
            <Slot />
        </AuthProvider>
    );
}
