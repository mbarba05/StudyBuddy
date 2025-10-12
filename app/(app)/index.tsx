import { useAuth } from "@/auth/AuthProvider";
import { Button, Text, View } from "react-native";

export default function HomeScreen() {
    const { signOut } = useAuth();
    return (
        <View
            style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
            }}
        >
            <Text style={{ fontSize: 20 }}>Home</Text>
            <Button title="Sign out" onPress={signOut} />
        </View>
    );
}
