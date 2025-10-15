import { useAuth } from "@/auth/AuthProvider";
import { RedButton } from "@/components/Buttons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
    const { signOut } = useAuth();
    return (
        <SafeAreaView className="flex-1 justify-center items-center bg-colors-background">
            <RedButton onPress={signOut}>Sign Out</RedButton>
        </SafeAreaView>
    );
}
