import EditProfileForm from "@/components/features/profile/EditProfileForm";
import { RedButton } from "@/components/ui/Buttons";
import { useAuth } from "@/services/auth/AuthProvider";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
    const { signOut } = useAuth();
    return (
        <SafeAreaView className="flex-1 justify-center items-center bg-colors-background">
            <EditProfileForm />
            <RedButton onPress={signOut}>Sign Out</RedButton>
        </SafeAreaView>
    );
}
