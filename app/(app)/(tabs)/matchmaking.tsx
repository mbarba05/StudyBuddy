import MatchMakingCard from "@/components/MatchMakingCard";
import { useAuth } from "@/services/auth/AuthProvider";
import { getPotentialMatches } from "@/services/profileService";
import { recordSwipe } from "@/services/swipeService";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Swiper } from "swiper/react";

// Get the screen width of the device (used for responsive card sizing)
const SCREEN_WIDTH = Dimensions.get("window").width;
//For web browser
const CARD_WIDTH = Platform.OS === "web" ? 420 : SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = Platform.OS === "web" ? 520 : SCREEN_WIDTH * 1.1;
// MatchmakingScreen component
export default function MatchmakingScreen() {
    // Access the current authenticated user
    const { user } = useAuth();
    // Store all profiles retrieved from Supabase and filter user out
    const [profiles, setProfiles] = useState<any[]>([]);
    // Boolean to show a loading spinner while profiles are being fetched
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const loadProfiles = async () => {
            try {
                // Ensure user is logged in
                if (!user?.id) return;
                // Fetch matches from Supabase
                const potentialMatches = await getPotentialMatches();
                setProfiles(potentialMatches);
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

    //Handle a swipe left/right action. Records swipe in Supabase. Removes profile from local deck.
    const handleSwipe = async (direction: string, targetProfile: any) => {
        // Log the swipe action
        console.log(`Swiped ${direction} on ${targetProfile.display_name}`);
        // Record the swipe in Supabase
        if (direction === "left" || direction === "right") {
            await recordSwipe(user.id, targetProfile.user_id, direction as "left" | "right");
        }

        // Remove current profile from stack
        setProfiles((prev) => prev.filter((p) => p.user_id !== targetProfile.user_id));
    };

    // Loading spinner while fetching data
    if (loading)
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-colors-background">
                <ActivityIndicator
                    size="large"
                    color="#00BFFF"
                />
                <Text className="text-white mt-3">Loading profiles...</Text>
            </SafeAreaView>
        );

    // Empty state when no more profiles left
    if (profiles.length === 0)
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-colors-background">
                <Text className="text-white text-lg mb-2">No profiles available</Text>
            </SafeAreaView>
        );

    return (
        <SafeAreaView className="flex-1 bg-colors-background">
            <View style={{ flex: 1 }}>
                {/* top reset button */}
                <View className="items-center mt-10"></View>

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
                        {[...profiles].reverse().map((profile, index) => (
                            <Swiper
                                key={profile.user_id}
                                onSwipe={(dir) => handleSwipe(dir, profile)}
                                preventSwipe={["up", "down"]}
                            >
                                <View
                                    style={{
                                        position: "absolute",
                                        alignSelf: "center",
                                        top: Platform.OS === "web" ? index * 3 : index * 4,
                                        zIndex: index,
                                    }}
                                >
                                    <MatchMakingCard
                                        name={profile.display_name}
                                        major={profile.major?.name}
                                        year={profile.year}
                                        imageUrl={profile.pp_url}
                                        width={CARD_WIDTH}
                                        height={CARD_HEIGHT}
                                    />
                                </View>
                            </Swiper>
                        ))}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}
