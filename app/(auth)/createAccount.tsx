import { LoginButton, RedButton } from "@/components/Buttons";
import { LoginInput } from "@/components/TextInputs";
import {
    MIN_PASSWORD_LENGTH,
    VALID_EMAIL_DOMAIN,
} from "@/services/auth/authModels";
import { useAuth } from "@/services/auth/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateAccountScreen() {
    const router = useRouter();
    const { signUp } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordsMatch, setPasswordsMatch] = useState(false);
    const [errorText, setErrorText] = useState("");
    const [canPress, setCanPress] = useState(false);
    const [fresnoStateEmail, setFresnoStateEmail] = useState(false);

    useEffect(() => {
        setFresnoStateEmail(email.endsWith(VALID_EMAIL_DOMAIN));
    }, [email]);

    useEffect(() => {
        const match =
            password.length >= MIN_PASSWORD_LENGTH &&
            password === confirmPassword;
        setPasswordsMatch(match);
    }, [password, confirmPassword]);

    useEffect(() => {
        setCanPress(passwordsMatch && fresnoStateEmail);
    }, [fresnoStateEmail, passwordsMatch]);

    const displayError = () => {
        if (!fresnoStateEmail) {
            setErrorText("Please enter a valid Fresno State student email.");
            return;
        }
        if (!confirmPassword) {
            setErrorText("Please enter a password.");
            return;
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
            setErrorText(
                `Password length must be at least ${MIN_PASSWORD_LENGTH} characters.`
            );
            return;
        }
        if (!passwordsMatch) {
            setErrorText("Passwords do not match.");
            return;
        }
    };

    const onSignUp = async () => {
        try {
            if (
                !fresnoStateEmail ||
                !passwordsMatch ||
                password.length < MIN_PASSWORD_LENGTH
            ) {
                displayError();
                return;
            }
            await signUp(email.trim(), password);
            // Alert.alert(
            //     "Check your email",
            //     "If confirmations are enabled, you must confirm before signing in."
            // );
        } catch (e: any) {
            setErrorText(e.message ?? String(e));
            Alert.alert("Sign up failed", e.message ?? String(e));
        }
    };

    return (
        <SafeAreaView className="flex-1 p-12 justify-center items-center bg-colors-background gap-4">
            <View className="flex flex-row gap-2">
                <Text className="text-colors-text font-bold text-5xl text-center">
                    Create Account
                </Text>
                <Ionicons name="person-add" size={36} color="#fff" />
            </View>
            <Text className="text-colors-textSecondary text-lg text-center font-semibold">
                Use your Fresno State Email
            </Text>
            <LoginInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="Email"
                placeholderTextColor="darkgray"
                value={email}
                onChangeText={setEmail}
            />
            <LoginInput
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="darkgray"
            />
            <LoginInput
                placeholder="Confirm Password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholderTextColor="darkgray"
            />
            <LoginButton
                bgColor="bg-colors-secondary"
                textColor="text-colors-text"
                onPress={canPress ? onSignUp : displayError}
            >
                Create Account
            </LoginButton>
            <Text className="text-colors-error font-semibold">{errorText}</Text>

            <RedButton onPress={() => router.back()}>Go Back</RedButton>
        </SafeAreaView>
    );
}
