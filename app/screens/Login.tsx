import { signInWithGoogle } from "@/lib/google";
import { Button } from "@react-navigation/elements";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const Login = () => {
    return (
        <SafeAreaView className="flex flex-col items-center justify-center h-screen">
            <Button onPressOut={signInWithGoogle}>Sign in with Google</Button>
        </SafeAreaView>
    );
};

export default Login;
