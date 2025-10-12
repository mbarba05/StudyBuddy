import { useAuth } from "@/auth/AuthProvider";
import { Redirect, Slot } from "expo-router";

export default function AuthLayout() {
    const { user } = useAuth();

    if (user) return <Redirect href="/(app)" />; //already signed in, we nav to app
    return <Slot />; //show login routes
}
