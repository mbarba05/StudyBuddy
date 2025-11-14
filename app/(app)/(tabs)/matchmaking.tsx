import MatchMakingCard from "@/components/MatchMakingCard";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useAuth } from "@/services/auth/AuthProvider";
import { getPotentialMatches } from "@/services/profileService";
import { recordSwipe } from "@/services/swipeService";
import React, { useEffect, useState } from "react";
import { Dimensions, Platform, Text, View } from "react-native";
import Swiper from "react-native-deck-swiper";
import { SafeAreaView } from "react-native-safe-area-context";

// Get the screen width of the device (used for responsive card sizing)
const SCREEN_WIDTH = Dimensions.get("window").width;
// For web browser
const CARD_WIDTH = Platform.OS === "web" ? 420 : SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = Platform.OS === "web" ? 520 : SCREEN_WIDTH * 1.1;

// MatchmakingScreen component
export default function MatchmakingScreen() {
    // Access the current authenticated user
    const { user } = useAuth();
    // Store all profiles retrieved from Supabase
    const [profiles, setProfiles] = useState<any[]>([]);
    // Boolean to show a loading spinner while profiles are being fetched
    const [loading, setLoading] = useState(true);
    // Track whether we've swiped through all profiles
    const [hasSwipedAll, setHasSwipedAll] = useState(false);

    useEffect(() => {
        const loadProfiles = async () => {
            try {
                // Ensure user is logged in
                if (!user?.id) return;
                // Fetch matches from Supabase
                const potentialMatches = await getPotentialMatches();
                setProfiles(potentialMatches);
                setHasSwipedAll(false);
                // Log loaded profiles for debugging
                console.log("Profiles loaded:", potentialMatches);
            } catch (err) {
                console.error("Error loading profiles:", err);
            } finally {
                setLoading(false);
            }
        };
        loadProfiles();
    }, [user]);

    // Handle a swipe left/right action. Records swipe in Supabase.
    const handleSwipe = async (direction: "left" | "right", cardIndex: number) => {
        const targetProfile = profiles[cardIndex];
        if (!targetProfile || !user?.id) return;

        console.log(`Swiped ${direction} on ${targetProfile.display_name}`);

        try {
            await recordSwipe(user.id, targetProfile.user_id, direction);
        } catch (err) {
            console.error("Error recording swipe:", err);
        }
    };

    const handleSwipedLeft = (cardIndex: number) => {
        void handleSwipe("left", cardIndex);
    };

    const handleSwipedRight = (cardIndex: number) => {
        void handleSwipe("right", cardIndex);
    };

    // Loading spinner while fetching data
    if (loading) return <LoadingScreen />;

    // Empty state when no more profiles left
    if (profiles.length === 0 || hasSwipedAll)
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-colors-background">
                <Text className="text-white text-lg mb-2">No profiles available</Text>
            </SafeAreaView>
        );

    return (
        <SafeAreaView className="flex-1 bg-colors-background">
            <View style={{ flex: 1 }}>
                {/* top reset button (placeholder for future) */}
                <View className="items-center mt-10" />

                {/* stacked cards */}
                <View
                    style={
                        Platform.OS === "web"
                            ? {
                                  flex: 1,
                                  alignItems: "center",
                                  justifyContent: "center",
                              }
                            : {
                                  position: "absolute",
                                  top: 120,
                                  left: 0,
                                  right: 0,
                                  alignItems: "center",
                              }
                    }
                >
                    <View
                        style={{
                            width: Platform.OS === "web" ? CARD_WIDTH : SCREEN_WIDTH,
                            height: Platform.OS === "web" ? CARD_HEIGHT + 40 : SCREEN_WIDTH * 1.25,
                            position: "relative",
                        }}
                    >
                        <Swiper
                            cards={profiles}
                            renderCard={(profile: any) => {
                                if (!profile) return null;
                                return (
                                    <MatchMakingCard
                                        name={profile.display_name}
                                        major={profile.major?.name}
                                        year={profile.year}
                                        imageUrl={profile.pp_url}
                                        width={CARD_WIDTH}
                                        height={CARD_HEIGHT}
                                    />
                                );
                            }}
                            onSwipedLeft={handleSwipedLeft}
                            onSwipedRight={handleSwipedRight}
                            onSwipedAll={() => setHasSwipedAll(true)}
                            backgroundColor="transparent"
                            stackSize={3}
                            stackScale={10}
                            stackSeparation={10}
                            disableTopSwipe
                            disableBottomSwipe
                            cardVerticalMargin={10}
                            containerStyle={{
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}
