import { colors } from "@/assets/colors";
import { LoadingScreen } from "@/components/ui/Loading";
import { BlockedUser, getBlockedUsers, unblockUser } from "@/services/profileService";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Image, Text, TouchableOpacity, View } from "react-native";

export default function BlockedUsersScreen() {
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [loading, setLoading] = useState(true);

    const loadBlockedUsers = async () => {
        try {
            const users = await getBlockedUsers();
            setBlockedUsers(users);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBlockedUsers();
    }, []);

    const handleUnblock = (id: string, name?: string | null) => {
        Alert.alert("Unblock User", `Unblock ${name || "this user"}?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Unblock",
                onPress: async () => {
                    try {
                        await unblockUser(id);
                        setBlockedUsers((prev) => prev.filter((u) => u.user_id !== id));
                    } catch (error) {
                        console.error(error);
                    }
                },
            },
        ]);
    };

    if (loading) return <LoadingScreen />;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
            {blockedUsers.length === 0 ? (
                <Text style={{ color: colors.textSecondary }}>No blocked users.</Text>
            ) : (
                <FlatList
                    data={blockedUsers}
                    keyExtractor={(item) => item.user_id}
                    renderItem={({ item }) => (
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                paddingVertical: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: "#333",
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                                {item.pp_url ? (
                                    <Image
                                        source={{ uri: item.pp_url }}
                                        style={{
                                            width: 50,
                                            height: 50,
                                            borderRadius: 25,
                                            marginRight: 10,
                                        }}
                                    />
                                ) : (
                                    <Ionicons
                                        name="person-circle"
                                        size={50}
                                        color="white"
                                        style={{ marginRight: 10 }}
                                    />
                                )}

                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: "white", fontWeight: "700" }}>
                                        {item.display_name || "Unknown User"}
                                    </Text>

                                    <Text style={{ color: "gray" }}>
                                        {item.major?.name || "No major"}
                                        {item.year ? ` • ${item.year}` : ""}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={() => handleUnblock(item.user_id, item.display_name)}
                                style={{
                                    backgroundColor: colors.primary,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 6,
                                    marginLeft: 10,
                                }}
                            >
                                <Text style={{ color: "white" }}>Unblock</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
        </View>
    );
}
