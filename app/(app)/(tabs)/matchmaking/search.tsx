import { colors } from "@/assets/colors";
import { SearchBar } from "@/components/ui/TextInputs";
import { mutualFriends, MutualFriends } from "@/services/friendshipsService";
import { ProfileForSearch, searchForProfile } from "@/services/profileService";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";

type ProfilerWMutuals = ProfileForSearch & MutualFriends;

const ProfileSearch = () => {
    const [searchResults, setSearchResults] = useState<ProfilerWMutuals[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchLoading, setSearchLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchResults = async () => {
            if (searchTerm.length === 0) {
                setSearchResults([]);
                return;
            }

            setSearchLoading(true);

            const results = await searchForProfile(searchTerm);

            const resWMutuals: ProfilerWMutuals[] = await Promise.all(
                results.map(async (r) => {
                    const mutuals = await mutualFriends(r.user_id);

                    return {
                        count: mutuals.count,
                        friends: mutuals.friends,
                        display_name: r.display_name,
                        major: r.major,
                        user_id: r.user_id,
                        year: r.year,
                        pp_url: r.pp_url,
                    };
                }),
            );

            setSearchResults(resWMutuals);
            setSearchLoading(false);
        };

        fetchResults();
    }, [searchTerm]);

    const viewProfileCard = (user: ProfileForSearch) => {
        router.push({
            pathname: "/matchmaking/viewProfile",
            params: {
                display_name: user.display_name,
                major: user.major,
                user_id: user.user_id,
                pp_url: user.pp_url,
                year: user.year,
            },
        });
    };

    //have this get recent user searches for other users
    const ListEmptyComponent = () => <Text></Text>;

    const renderItem = useCallback(
        ({ item }: { item: ProfilerWMutuals }) => {
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
                            {item.count > 0 && (
                                <Text
                                    className="color-colors-textSecondary text-lg"
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {item.count} {item.count == 1 ? "Mutual: " : item.count > 1 ? "Mutuals: " : null}
                                    {item.friends.map((f) => f.display_name).join(", ")}
                                </Text>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            );
        },
        [viewProfileCard],
    );

    return (
        <View className="flex-1 bg-colors-background p-4">
            <SearchBar placeholder="Search Users" value={searchTerm} onChangeText={setSearchTerm} autoCorrect={false} />
            {searchLoading ? (
                <ActivityIndicator className="mt-4" />
            ) : (
                <FlatList data={searchResults} renderItem={renderItem} />
            )}
        </View>
    );
};

export default ProfileSearch;
