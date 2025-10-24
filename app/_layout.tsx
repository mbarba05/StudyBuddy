import { AuthProvider } from "@/services/auth/AuthProvider";
import { OnboardingProvider } from "@/services/OnboardingProvider";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "./global.css";
//gonna have to deal with this error, if it bothers you,
//its something to do with css files not being recognized

export default function RootLayout() {
    return (
        <AuthProvider>
            <OnboardingProvider>
                <StatusBar style="auto" />
                <Slot />
            </OnboardingProvider>
        </AuthProvider>
    );
}
