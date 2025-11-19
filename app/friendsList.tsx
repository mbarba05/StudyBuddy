import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Image,
} from "react-native";
import { useAuth } from "@/services/auth/AuthProvider";
import { getAllFriends, removeFriend } from "@/services/friendshipsService";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FriendsListScreen() {
    const { user } = useAuth();
    const [friends, setFriends] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    const loadFriends = async () => {
        if (!user?.id) return;
        const list = await getAllFriends(user.id);
        setFriends(list);
    };


    useEffect(() => {
        loadFriends();
    }, [user?.id]);

    const filtered = friends.filter((f) =>
        f.full_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <SafeAreaView className="flex-1 bg-colors-background p-5">
         
            <Text className="text-3xl font-bold text-colors-text mb-6">
                Friends
            </Text>

            
            <View className="flex-row items-center bg-colors-primary border border-colors-text rounded-lg px-3 py-2">
                <Ionicons name="search" size={22} color="#fff" />
                <TextInput
                    placeholder="Search"
                    placeholderTextColor="#ccc"
                    value={search}
                    onChangeText={setSearch}
                    className="flex-1 ml-2 text-colors-text text-lg"
                />
            </View>


            {friends.length === 0 && (
                <View className="flex-1 items-center justify-center mt-10">
                    <Text className="text-colors-textSecondary text-xl">
                        You have no friends yet.
                    </Text>
                </View>
            )}

          
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.friend_id}
                className="mt-4"
                renderItem={({ item }) => (
                    <View className="flex-row items-center justify-between bg-colors-secondary p-4 mb-3 rounded-xl">

                       
                        <View className="flex-row items-center gap-3">
                            <Image
                                source={{
                                    uri:
                                        item.avatar_url ||
                                        "https://placehold.co/100x100",
                                }}
                                className="w-12 h-12 rounded-full"
                            />
                            <View>
                                <Text className="text-lg font-semibold text-colors-text">
                                    {item.full_name}
                                </Text>
                                <Text className="text-colors-textSecondary">
                                    {item.major} • {item.year}
                                </Text>
                            </View>
                        </View>

                        
                        <TouchableOpacity
                            onPress={async () => {
                                await removeFriend(user.id, item.friend_id);
                                loadFriends();
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
        </SafeAreaView>
    );
}

