import { useAuth } from "@/auth/AuthProvider";
import { LoginButton } from "@/components/Buttons";
import { TextSeparator } from "@/components/Seperators";
import { LoginInput } from "@/components/TextInputs";
import { signInWithGoogle } from "@/lib/google";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, Text, View } from "react-native";

export default function LoginScreen() {
    const router = useRouter();
    const { signIn, signUp } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const onSignIn = async () => {
        try {
            await signIn(email.trim(), password);
            router.replace("/(app)");
        } catch (e: any) {
            Alert.alert("Sign in failed", e.message ?? String(e));
        }
    };

    const onSignUp = async () => {
        try {
            await signUp(email.trim(), password);
            Alert.alert(
                "Check your email",
                "If confirmations are enabled, you must confirm before signing in."
            );
        } catch (e: any) {
            Alert.alert("Sign up failed", e.message ?? String(e));
        }
    };

    return (
        <View className="flex-1 p-12 justify-center bg-colors-background gap-4">
            <Text className="text-colors-text font-bold text-6xl text-center">
                Study Buddy
            </Text>
            <View className="flex gap-2.5">
                <Text className="text-colors-textSecondary text-xl text-center font-semibold">
                    Sign In
                </Text>
                <View className="flex flex-row items-center gap-2">
                    <LoginInput
                        autoCapitalize="none"
                        autoComplete="email"
                        keyboardType="email-address"
                        placeholder="Email"
                        placeholderTextColor="darkgray"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>
                <View className="flex flex-row items-center gap-2">
                    <LoginInput
                        placeholder="Password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        placeholderTextColor="darkgray"
                    />
                </View>
                <LoginButton onPress={onSignIn}>Log In</LoginButton>
            </View>
            <TextSeparator text="Or" />
            <LoginButton
                onPress={signInWithGoogle}
                image={
                    <Image
                        source={{
                            uri: "https://developers.google.com/identity/images/g-logo.png",
                        }}
                        style={{ width: 25, height: 25 }}
                    />
                }
            >
                Continue With Google
            </LoginButton>
            <TextSeparator text="Or" />
            <LoginButton onPress={onSignUp}>Create Account</LoginButton>
        </View>
    );
}
