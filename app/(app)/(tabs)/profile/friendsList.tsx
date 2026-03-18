import { SearchBar } from "@/components/ui/TextInputs";
import { FriendListItem, getAllFriends, getFriendsByInteraction, removeFriend } from "@/services/friendshipsService";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Text, TouchableOpacity, View } from "react-native";

export default function FriendsListScreen() {
    const [friends, setFriends] = useState<FriendListItem[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [sortMode, setSortMode] = useState<"all" | "least" | "most">("all");

    const loadFriends = async (mode: "all" | "least" | "most" = sortMode) => {
        setLoading(true);

        try {
            let list: FriendListItem[] = [];

            if (mode === "most") {
                list = await getFriendsByInteraction("most");
            } else if (mode === "least") {
                list = await getFriendsByInteraction("least");
            } else {
                list = await getAllFriends();
            }

            setFriends(list);
        } catch (error) {
            console.error("loadFriends error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFriends(sortMode);
    }, [sortMode]);

    const filtered = friends.filter((friend) => friend.full_name.toLowerCase().includes(search.toLowerCase()));

    return (
        <View className="flex-1 bg-colors-background p-5">
            <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder="Search Friends"
                autoCorrect={false}
                autoCapitalize="words"
            />

            <View className="flex-row flex-wrap gap-2 mt-4 mb-2">
                <TouchableOpacity
                    className={`px-4 py-2 rounded-full border border-colors-text ${
                        sortMode === "least" ? "bg-colors-secondary" : "bg-transparent"
                    }`}
                    onPress={() => setSortMode("least")}
                >
                    <Text className="text-colors-text text-xs font-medium">Least Interacted With</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className={`px-4 py-2 rounded-full border border-colors-text ${
                        sortMode === "most" ? "bg-colors-secondary" : "bg-transparent"
                    }`}
                    onPress={() => setSortMode("most")}
                >
                    <Text className="text-colors-text text-xs font-medium">Most Interacted With</Text>
                </TouchableOpacity>

                {sortMode !== "all" && (
                    <TouchableOpacity
                        className="px-4 py-2 rounded-full border border-colors-text bg-transparent"
                        onPress={() => setSortMode("all")}
                    >
                        <Text className="text-colors-text text-xs font-medium">Clear</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <ActivityIndicator className="mt-8" />
            ) : (
                <View className="flex-1">
                    {friends.length === 0 && (
                        <View className="flex-1 items-center mt-8">
                            <Text className="text-colors-textSecondary text-xl">You have no friends yet.</Text>
                        </View>
                    )}

                    <FlatList
                        data={filtered}
                        keyExtractor={(item) => item.friend_id}
                        className="mt-2"
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View className="flex-row items-center justify-between bg-colors-secondary p-4 mb-3 rounded-xl border border-colors-text">
                                <View className="flex-row items-center gap-3 flex-1 mr-3">
                                    <Image
                                        source={{
                                            uri: item.avatar_url || "https://placehold.co/100x100",
                                        }}
                                        className="w-12 h-12 rounded-full"
                                    />

                                    <View className="flex-1">
                                        <Text className="text-lg font-semibold text-colors-text" numberOfLines={1}>
                                            {item.full_name}
                                        </Text>

                                        <Text className="text-colors-textSecondary" numberOfLines={1}>
                                            {(item.major ?? "Undeclared") + " • " + (item.year ?? "Unknown")}
                                        </Text>

   
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={() => {
                                        Alert.alert(
                                            "Remove Friend",
                                            `Are you sure you want to remove ${item.full_name} as a friend?`,
                                            [
                                                {
                                                    text: "Cancel",
                                                    style: "cancel",
                                                },
                                                {
                                                    text: "Remove",
                                                    style: "destructive",
                                                    onPress: async () => {
                                                        await removeFriend(item.friend_id);
                                                        loadFriends(sortMode);
                                                    },
                                                },
                                            ],
                                        );
                                    }}
                                >
                                    <Ionicons name="remove-circle" size={30} color="#ff3b30" />
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                </View>
            )}
        </View>
    );
}
