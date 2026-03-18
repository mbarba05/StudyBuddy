import { colors } from "@/assets/colors";
import { SearchBar } from "@/components/ui/TextInputs";
import { ProfileForSearch, searchForProfile } from "@/services/profileService";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";

const ProfileSearch = () => {
    const [searchResults, setSearchResults] = useState<ProfileForSearch[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchLoading, setSearchLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchResults = async () => {
            if (searchTerm.length == 0) {
                setSearchResults([]);
                return;
            }

            setSearchLoading(true);
            const results = await searchForProfile(searchTerm);

            setSearchResults(results);
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
        ({ item }: { item: ProfileForSearch }) => {
            return (
                <TouchableOpacity
                    className="flex-row items-center justify-between py-2 border-b border-colors-textSecondary w-full"
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
                        </View>
                    </View>
                </TouchableOpacity>
            );
        },
        [viewProfileCard],
    );

    return (
        <View className="flex-1 bg-colors-background p-4">
            <SearchBar placeholder="Search Users" value={searchTerm} onChangeText={setSearchTerm} />
            {searchLoading ? (
                <ActivityIndicator className="mt-4" />
            ) : (
                <FlatList data={searchResults} renderItem={renderItem} />
            )}
        </View>
    );
};

export default ProfileSearch;
