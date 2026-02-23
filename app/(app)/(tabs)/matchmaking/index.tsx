import MatchMakingCard from "@/components/MatchMakingCard";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useAuth } from "@/services/auth/AuthProvider";
import { sendFriendRequest } from "@/services/friendshipsService";
import { getPotentialMatches } from "@/services/profileService";
import { sendMatchNotification } from "@/services/PushNotifications";
import { getSwipeStatus, recordSwipe, SwipeLimitErr } from "@/services/swipeService";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Swiper from "react-native-deck-swiper";

const TEST_MODE = false; //  flip to false when done testing.

function formatTime(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function MatchmakingScreen() {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasSwipedAll, setHasSwipedAll] = useState(false);

    // added to stop cards from swipping on the match making screen
    const [remainingSwipes, setRemainingSwipes] = useState<number | null>(null);
    const [outOfSwipes, setOutOfSwipes] = useState(false);
    const [resetAtISO, setResAtISO] = useState<string | undefined>(undefined);

    const [timeLeft, setTimeLeft] = useState<number>(0);
    const loadProfiles = async () => {
        setLoading(true);
        try {
            const status = await getSwipeStatus();
            setRemainingSwipes(status.remaining);
            setResAtISO(status.resetAtISO);

            if (status.remaining === 0) {
                setOutOfSwipes(true);
                setProfiles([]);
                setHasSwipedAll(true);
                return;
            }
            setOutOfSwipes(false);
            setHasSwipedAll(false);
            const potentialMatches = await getPotentialMatches();
            setProfiles(potentialMatches);
        } catch (err) {
            console.log("Error Loading Profiles:", err);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        void loadProfiles();
    }, []);

    //function to format how the countdown is displayed "hours:minutes:seconds"
    function timeFormat(diffMs: number): string {
        const Totalseconds = Math.floor(diffMs / 1000);

        const hours = Math.floor(Totalseconds / 3600);
        const minutes = Math.floor((Totalseconds % 3600) / 60);
        const seconds = Totalseconds % 60;
        const pad = (n: number) => n.toString().padStart(2, "0");

        return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
    }

    // timer for auto unlocking profile deck... also has a countdown of how much time left before unlocked
    useEffect(() => {
        if (!resetAtISO) return;
        const interval = setInterval(() => {
            const now = Date.now();
            const resetTime = new Date(resetAtISO).getTime();
            const diff = Math.max(0, resetTime - now);
            setTimeLeft(diff);

            if (diff <= 0) {
                clearInterval(interval);
                setOutOfSwipes(false);
                setHasSwipedAll(false);
                setResAtISO(undefined);
                void loadProfiles(); // auto reload profiles after timer done
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [resetAtISO]);

    // prevent the deck to swipe
    const lockDeck = (reset?: string) => {
        setOutOfSwipes(true);
        setResAtISO(reset);
        setProfiles([]);
        setHasSwipedAll(true);
        setRemainingSwipes(0);
    };

    const handleSwipe = async (direction: "left" | "right", cardIndex: number) => {
        const targetProfile = profiles[cardIndex];
        if (!targetProfile) return;
        console.log(`Swiped ${direction} on ${targetProfile.display_name}`);
        if (TEST_MODE) {
            console.log("[TEST_MODE] Not recording swipe to Supabase");
            return;
        }

        try {
            const res = await recordSwipe(targetProfile.user_id, direction);
            // updating remaining swipes in real time
            setRemainingSwipes(res.remaining);

            // if last swiped was used; lock
            if (res.remaining === 0) {
                const status = await getSwipeStatus();
                lockDeck(status.resetAtISO);
            }
        } catch (err: any) {
            if (err instanceof SwipeLimitErr) {
                lockDeck(err.resetAtISO);
                return;
            }
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

    // Empty state when no more profiles left.. it displays the time countdown until more profiles available
    if (profiles.length === 0 || hasSwipedAll || outOfSwipes)
        return (
            <View className="flex-1 justify-center items-center bg-colors-background">
                <Text className="text-white text-lg mb-2">No profiles available</Text>

                {outOfSwipes && resetAtISO ? (
                    <Text className="text-gray-400">More Swipes in {timeFormat(timeLeft)}</Text>
                ) : null}
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
                // prevents the next card from being swiped on after limit is reached
                disableLeftSwipe={outOfSwipes}
                disableRightSwipe={outOfSwipes}
            />

            {/*shows remaining swipes */}
            {remainingSwipes != null && (
                <View style={{ position: "absolute", top: 5, alignSelf: "center" }}>
                    <Text style={{ color: "white" }}>Swipes left : {remainingSwipes}</Text>
                </View>
            )}
        </View>
    );
}
