import { SearchBar } from "@/components/ui/TextInputs";
import { getAllFriends, removeFriend } from "@/services/friendshipsService";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Text, TouchableOpacity, View } from "react-native";

export default function FriendsListScreen() {
    const [friends, setFriends] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const loadFriends = async () => {
        setLoading(true);
        const list = await getAllFriends();
        setFriends(list);
        setLoading(false);
    };

    useEffect(() => {
        loadFriends();
    }, []);

    const filtered = friends.filter((f) => f.full_name.toLowerCase().includes(search.toLowerCase()));
    return (
        <View className="flex-1 bg-colors-background p-5">
            <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder="Search Friends"
                autoCorrect={false}
                autoCapitalize="words"
            />
            {loading ? (
                <ActivityIndicator className="mt-8" />
            ) : (
                <View>
                    {friends.length === 0 && (
                        <View className="flex-1 items-center mt-8">
                            <Text className="text-colors-textSecondary text-xl">You have no friends yet.</Text>
                        </View>
                    )}
                    <FlatList
                        data={filtered}
                        keyExtractor={(item) => item.friend_id}
                        className="mt-4"
                        renderItem={({ item }) => (
                            <View className="flex-row items-center justify-between bg-colors-secondary p-4 mb-3 rounded-xl border border-colors-text">
                                <View className="flex-row items-center gap-3">
                                    <Image
                                        source={{
                                            uri: item.avatar_url || "https://placehold.co/100x100",
                                        }}
                                        className="w-12 h-12 rounded-full"
                                    />
                                    <View>
                                        <Text className="text-lg font-semibold text-colors-text">{item.full_name}</Text>
                                        <Text className="text-colors-textSecondary">
                                            {item.major} • {item.year}
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
                                                        loadFriends();
                                                    },
                                                },
                                            ]
                                        );
                                    }}
                                >
                                    <Ionicons
                                        name="remove-circle"
                                        size={30}
                                        color="#ff3b30"
                                    />
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                </View>
            )}
        </View>
    );
}
