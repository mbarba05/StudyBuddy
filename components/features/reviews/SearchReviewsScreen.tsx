import { colors } from "@/assets/colors";
import { SearchBar } from "@/components/ui/TextInputs";
import { getProfessorsForSearch, ProfessorForSearch } from "@/services/professorService";
import {
    getPopularSearchesByMajor,
    getRecentSearchesForUser,
    updateRecentlyViewedRevForUser,
    updateRecentlyViewedRevGlobal,
} from "@/services/reviewsService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";

const SearchReviewsScreen = () => {
    const [foundProfs, setfoundProfs] = useState<ProfessorForSearch[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState<ProfessorForSearch[]>([]);
    const [popularSearches, setPopularSearches] = useState<ProfessorForSearch[]>([]);
    const [recentLoading, setRecentLoading] = useState(false);
    const [popularLoading, setPopularLoading] = useState(false);

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

    useEffect(() => {
        let isMounted = true;

        const fetchInitialData = async () => {
            setRecentLoading(true);
            setPopularLoading(true);

            const [recentResults, popularResults] = await Promise.all([
                getRecentSearchesForUser(),
                getPopularSearchesByMajor(),
            ]);

            if (!isMounted) return;

            setRecentSearches(recentResults ?? []);
            setPopularSearches(popularResults ?? []);
            setRecentLoading(false);
            setPopularLoading(false);
        };

        fetchInitialData();

        return () => {
            isMounted = false;
        };
    }, []);

    const profListItemPress = (item: ProfessorForSearch) => {
        router.push({
            pathname: "/(app)/(tabs)/reviews/professor/[profId]",
            params: {
                profId: String(item.id),
                profName: item.name,
                totalReviews: item.reviewcount ?? 0,
            },
        });

        setRecentSearches((prev) => {
            const withoutItem = prev.filter((rs) => rs.id !== item.id);
            return [item, ...withoutItem].slice(0, 3);
        });

        updateRecentlyViewedRevForUser(item.id);
        updateRecentlyViewedRevGlobal(item.id);
    };

    const ProfListItem = useCallback(
        ({ item }: { item: ProfessorForSearch }) => {
            return (
                <TouchableOpacity
                    className="flex-row items-center justify-between p-4 border-b border-colors-textSecondary"
                    onPress={() => profListItemPress(item)}
                >
                    <View>
                        <Text className="color-colors-text text-2xl font-semibold">{item.name}</Text>
                        <Text className="color-colors-textSecondary text-lg">{item.reviewcount} Reviews</Text>
                    </View>

                    <Ionicons name="arrow-forward" color={colors.text} size={24} />
                </TouchableOpacity>
            );
        },
        [router],
    );

    const ListEmptyComponent = () => (
        <Text className="text-xl color-colors-textSecondary text-center mt-4">No professors found.</Text>
    );

    const keyExtractor = useCallback((item: ProfessorForSearch) => String(item.id), []);

    const RecentAndPopularSearches = () => {
        //show this when search length less than 3
        return (
            <View>
                <Text className="text-xl color-colors-textSecondary text-center mt-4">
                    Type at least 3 characters to search.
                </Text>

                <Text className="text-xl color-colors-textSecondary text-left mt-4">Recent searches</Text>
                {recentLoading ? (
                    <ActivityIndicator className="mt-4" />
                ) : (
                    <FlatList
                        keyExtractor={keyExtractor}
                        data={recentSearches}
                        renderItem={ProfListItem}
                        ListEmptyComponent={ListEmptyComponent}
                    />
                )}
                <Text className="text-xl color-colors-textSecondary text-left mt-4">
                    Popular searches for your major
                </Text>
                {popularLoading ? (
                    <ActivityIndicator className="mt-4" />
                ) : (
                    <FlatList
                        keyExtractor={keyExtractor}
                        data={popularSearches}
                        renderItem={ProfListItem}
                        ListEmptyComponent={ListEmptyComponent}
                    />
                )}
            </View>
        );
    };

    const SearchResults = () => {
        if (loading) return <ActivityIndicator className="mt-4" />;
        return (
            <FlatList
                keyExtractor={keyExtractor}
                data={foundProfs}
                renderItem={ProfListItem}
                ListEmptyComponent={ListEmptyComponent}
            />
        );
    };

    return (
        <View className="flex-1 bg-colors-background p-4">
            <SearchBar
                autoCapitalize="words"
                autoCorrect={false}
                value={searchTerm}
                onChangeText={(e) => setSearchTerm(e)}
                placeholder="Search Professor"
            />
            {searchTerm.length >= 3 ? SearchResults() : RecentAndPopularSearches()}
        </View>
    );
};

export default SearchReviewsScreen;
