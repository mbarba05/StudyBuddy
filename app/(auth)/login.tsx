import { useAuth } from "@/auth/AuthProvider";
import { LoginInput } from "@/components/TextInputs";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Button, Text, View } from "react-native";

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
        <View className="flex-1 p-12 justify-center bg-white">
            <View className="border border-black p-5 ">
                <Text>Log in with Fresno State Email</Text>
                <View className="flex flex-row items-center gap-2">
                    <Ionicons name="mail" size={32} />
                    <LoginInput
                        autoCapitalize="none"
                        autoComplete="email"
                        keyboardType="email-address"
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>
                <View className="flex flex-row items-center gap-2">
                    <Ionicons name="lock-closed" size={32} />
                    <LoginInput
                        placeholder="Password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                </View>
                <Button title="Sign In" onPress={onSignIn} />
            </View>
            <Button title="Create Account" onPress={onSignUp} />
        </View>
    );
}
