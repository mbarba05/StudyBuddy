import { LoginButton } from "@/components/ui/Buttons";
import { TextSeparator } from "@/components/ui/Seperators";
import { LoginInput } from "@/components/ui/TextInputs";
import { signInWithGoogle } from "@/lib/google";
import { useAuth } from "@/services/auth/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
    const router = useRouter();
    const { signIn } = useAuth();
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

    return (
        <SafeAreaView className="flex-1 p-12 justify-center bg-colors-background gap-2">
            <Text className="text-colors-textSecondary text-center text-4xl">Welcome To</Text>
            <View className="flex flex-row items-center justify-center gap-4">
                <Ionicons name="school" size={36} color="#fff" />
                <Text className="text-colors-text font-bold text-5xl text-center">Study Buddy</Text>
                <Ionicons name="people" size={36} color="#fff" />
            </View>
            <Text className="text-colors-textSecondary text-center text-xl mb-12">
                Made by Fresno State students, for Fresno State Students
            </Text>
            <View className="flex gap-2.5">
                <Text className="text-colors-text text-xl font-semibold">Sign In</Text>
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
                <LoginButton bgColor="bg-colors-primary" textColor="text-colors-text" onPress={onSignIn}>
                    Log In
                </LoginButton>
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
            <LoginButton
                bgColor="bg-colors-secondary"
                textColor="text-colors-text"
                onPress={() => router.push("/createAccount")}
            >
                Create Account
            </LoginButton>
        </SafeAreaView>
    );
}
