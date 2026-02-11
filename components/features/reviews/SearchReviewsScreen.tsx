import { colors } from "@/assets/colors";
import { SearchBar } from "@/components/ui/TextInputs";
import { getProfessorsForSearch, ProfessorForSearch } from "@/services/professorService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";

const SearchReviewsScreen = () => {
    const [foundProfs, setfoundProfs] = useState<ProfessorForSearch[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const getProfForSearch = async () => {
            setLoading(true);
            const results = await getProfessorsForSearch(searchTerm);
            setfoundProfs(results);
            setLoading(false);
        };
        if (searchTerm.length < 3) {
            setfoundProfs([]);
            return;
        }
        getProfForSearch();
    }, [searchTerm]);

    const ProfListItem = useCallback(
        ({ item }: { item: ProfessorForSearch }) => {
            return (
                <TouchableOpacity
                    className="flex-row items-center justify-between p-4 border-b border-colors-textSecondary"
                    onPress={() =>
                        router.push({
                            pathname: "/(app)/(tabs)/reviews/professor/[profId]",
                            params: {
                                profId: String(item.id),
                                profName: item.name,
                                totalReviews: item.reviewCount ?? 0,
                            },
                        })
                    }
                >
                    <View>
                        <Text className="color-colors-text text-2xl font-semibold">{item.name}</Text>
                        <Text className="color-colors-textSecondary text-lg">{item.reviewCount} Reviews</Text>
                    </View>

                    <Ionicons
                        name="arrow-forward"
                        color={colors.text}
                        size={24}
                    />
                </TouchableOpacity>
            );
        },
        [router],
    );

    const ListEmptyComponent = () => {
        return searchTerm.length < 3 ? (
            <Text className="text-xl color-colors-textSecondary text-center mt-4">Type at least 3 characters</Text>
        ) : (
            <Text className="text-xl color-colors-textSecondary text-center mt-4">No professors found.</Text>
        );
    };

    const keyExtractor = useCallback((item: ProfessorForSearch) => String(item.id), []);

    return (
        <View className="flex-1 bg-colors-background p-4">
            <SearchBar
                autoCapitalize="words"
                autoCorrect={false}
                value={searchTerm}
                onChangeText={(e) => setSearchTerm(e)}
                placeholder="Search Professor"
            />
            {loading ? (
                <ActivityIndicator className="mt-4" />
            ) : (
                <FlatList
                    keyExtractor={keyExtractor}
                    data={foundProfs}
                    renderItem={ProfListItem}
                    ListEmptyComponent={ListEmptyComponent}
                />
            )}
        </View>
    );
};

export default SearchReviewsScreen;
