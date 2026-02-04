import MatchMakingCard from "@/components/MatchMakingCard";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useAuth } from "@/services/auth/AuthProvider";
import { sendFriendRequest } from "@/services/friendshipsService";
import { getPotentialMatches } from "@/services/profileService";
import { sendMatchNotification } from "@/services/PushNotifications";
import { recordSwipe } from "@/services/swipeService";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Swiper from "react-native-deck-swiper";

const TEST_MODE = false; //  flip to false when done testing.

export default function MatchmakingScreen() {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasSwipedAll, setHasSwipedAll] = useState(false);

    useEffect(() => {
        const loadProfiles = async () => {
            try {
                const potentialMatches = await getPotentialMatches();
                setProfiles(potentialMatches);
                setHasSwipedAll(false);
            } catch (err) {
                console.error("Error loading profiles:", err);
            } finally {
                setLoading(false);
            }
        };
        loadProfiles();
    }, []);

    const handleSwipe = async (direction: "left" | "right", cardIndex: number) => {
        const targetProfile = profiles[cardIndex];
        if (!targetProfile) return;
        console.log(`Swiped ${direction} on ${targetProfile.display_name}`);
        if (TEST_MODE) {
            console.log("[TEST_MODE] Not recording swipe to Supabase");
            return;
        }

        try {
            await recordSwipe(targetProfile.user_id, direction);
        } catch (err) {
            console.error("Error recording swipe:", err);
        }
    };

    const handleSwipedLeft = (cardIndex: number) => {
        void handleSwipe("left", cardIndex);
    };

    const handleSwipedRight = (cardIndex: number) => {
        void (async () => {
            const targetProfile = profiles[cardIndex];
            if (!targetProfile) return;
            try {
                await handleSwipe("right", cardIndex);
                await sendFriendRequest(targetProfile.user_id); // receiver_id = the other user
                await sendMatchNotification(
                    targetProfile.user_id,
                    `${(user as any).display_name} likes you! Check your matches to connect.`,
                );
            } catch (err) {
                console.error("Error sending friend request", err);
            }
        })();
    };

    // Loading spinner while fetching data
    if (loading) return <LoadingScreen />;

    // Empty state when no more profiles left
    if (profiles.length === 0 || hasSwipedAll)
        return (
            <View className="flex-1 justify-center items-center bg-colors-background">
                <Text className="text-white text-lg mb-2">No profiles available</Text>
            </View>
        );

    return (
        <View className="bg-colors-background flex-1 flex justify-center">
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
            />
        </View>
    );
}
