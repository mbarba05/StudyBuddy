import { colors } from "@/assets/colors";
import { SearchBar } from "@/components/ui/TextInputs";
import {
    clearRecentSearch,
    getRecentSearches,
    ProfileForSearch,
    ProfileWithMutuals,
    RecentSearchWithProfile,
    searchForProfileWithMutuals,
    upsertRecentSearch,
} from "@/services/profileService";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";

const ProfileSearch = () => {
    const [searchResults, setSearchResults] = useState<ProfileWithMutuals[]>([]);
    const [recentSearches, setRecentSearches] = useState<RecentSearchWithProfile[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchLoading, setSearchLoading] = useState(false);
    const searchRef = useRef(0);
    const router = useRouter();

    // Load recent searches on mount
    useEffect(() => {
        loadRecentSearches();
    }, []);

    const loadRecentSearches = async () => {
        const recents = await getRecentSearches();
        setRecentSearches(recents);
    };

    useEffect(() => {
        if (searchTerm.length === 0) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }
        if (searchTerm.length < 2) return;

        setSearchLoading(true);
        const id = ++searchRef.current;

        const timeoutId = setTimeout(async () => {
            try {
                const results = await searchForProfileWithMutuals(searchTerm);
                if (searchRef.current === id) {
                    setSearchResults(results);
                }
            } finally {
                if (searchRef.current === id) {
                    setSearchLoading(false);
                }
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const viewProfileCard = (user: ProfileForSearch) => {
        upsertRecentSearch(user.user_id).then(() => loadRecentSearches());
        console.log("USER: ", user)
        router.push({
            pathname: "/matchmaking/viewProfile",
            params: {
                display_name: user.display_name,
                major: user.major,
                user_id: user.user_id,
                pp_url: user.pp_url,
                year: user.year,
                bio: user.bio,
                photo_urls: JSON.stringify(user.photo_urls || []),
            },
        });
    };

    const handleClearRecent = async (recentId: number) => {
        await clearRecentSearch(recentId);
        setRecentSearches((prev) => prev.filter((r) => r.id !== recentId));
    };

    const renderItem = useCallback(
        ({ item }: { item: ProfileWithMutuals }) => {
            return (
                <TouchableOpacity
                    className="flex-row items-center justify-between py-2 border-b border-colors-textSecondary w-full max-h-24"
                    onPress={() => viewProfileCard(item)}
                >
                    <View className="flex-row gap-4 flex-1">
                        <Image
                            contentFit="cover"
                            source={{ uri: item.pp_url as string }}
                            style={{
                                width: 54,
                                height: 54,
                                borderRadius: 27,
                                borderColor: colors.textSecondary,
                                borderWidth: 1,
                            }}
                            cachePolicy="memory-disk"
                        />
                        <View className="flex-1">
                            <Text className="color-colors-text text-2xl font-semibold">{item.display_name}</Text>
                            {item.mutual_count > 0 && (
                                <Text
                                    className="color-colors-textSecondary text-lg"
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {item.mutual_count} {item.mutual_count == 1 ? "Mutual: " : "Mutuals: "}
                                    {item.mutual_friends.map((f) => f.display_name).join(", ")}
                                </Text>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            );
        },
        [viewProfileCard],
    );

    const renderRecentItem = useCallback(
        ({ item }: { item: RecentSearchWithProfile }) => {
            return (
                <TouchableOpacity
                    className="flex-row items-center justify-between py-2 border-b border-colors-textSecondary w-full max-h-24"
                    onPress={() => viewProfileCard(item.profile)}
                >
                    <View className="flex-row gap-4 flex-1">
                        <Image
                            contentFit="cover"
                            source={{ uri: item.profile.pp_url as string }}
                            style={{
                                width: 54,
                                height: 54,
                                borderRadius: 27,
                                borderColor: colors.textSecondary,
                                borderWidth: 1,
                            }}
                            cachePolicy="memory-disk"
                        />
                        <View className="flex-1 justify-center">
                            <Text className="color-colors-text text-2xl font-semibold">
                                {item.profile.display_name}
                            </Text>
                            <Text className="color-colors-textSecondary text-lg">{item.profile.major}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => handleClearRecent(item.id)} className="p-2">
                        <Ionicons name="close" size={22} color={colors.textSecondary} />
                    </TouchableOpacity>
                </TouchableOpacity>
            );
        },
        [viewProfileCard, handleClearRecent],
    );

    const showRecents = searchTerm.length === 0 && recentSearches.length > 0;

    return (
        <View className="flex-1 bg-colors-background p-4">
            <SearchBar placeholder="Search Users" value={searchTerm} onChangeText={setSearchTerm} autoCorrect={false} />
            {searchLoading ? (
                <ActivityIndicator className="mt-4" />
            ) : showRecents ? (
                <View className="mt-4">
                    <Text className="color-colors-textSecondary text-lg mb-2">Recent Searches</Text>
                    <FlatList
                        data={recentSearches}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderRecentItem}
                    />
                </View>
            ) : (
                <FlatList data={searchResults} renderItem={renderItem} />
            )}
        </View>
    );
};

export default ProfileSearch;
