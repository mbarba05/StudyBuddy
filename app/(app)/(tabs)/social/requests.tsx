// app/(app)/(tabs)/social.tsx
import MatchMakingCard from "@/components/MatchMakingCard";
import { LoadingScreen } from "@/components/ui/Loading";
import {
    acceptFriendRequest,
    getIncomingFriendRequests,
    PendingFriendRequest,
    rejectFriendRequest,
} from "@/services/friendshipsService";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Swiper from "react-native-deck-swiper";

export default function RequestsScreen() {
    const [requests, setRequests] = useState<PendingFriendRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasSwipedAll, setHasSwipedAll] = useState(false);

    useEffect(() => {
        const loadRequests = async () => {
            try {
                const data = await getIncomingFriendRequests();
                console.log("DATA: ", data);

                setRequests(data);
                setHasSwipedAll(false);
            } catch (err) {
                console.error("Error loading friend requests", err);
            } finally {
                setLoading(false);
            }
        };

        loadRequests();
    }, []);

    const handleAccept = (cardIndex: number) => {
        void (async () => {
            const req = requests[cardIndex];
            if (!req) return;

            try {
                await acceptFriendRequest(req.id, req.sender_id, req.receiver_id);
            } catch (err) {
                console.error("Error accepting friend request", err);
            }
        })();
    };

    const handleReject = (cardIndex: number) => {
        void (async () => {
            const req = requests[cardIndex];
            if (!req) return;

            try {
                await rejectFriendRequest(req.id);
                // remove this request from local state
                //setRequests((prev) => prev.filter((_, i) => i !== cardIndex));
            } catch (err) {
                console.error("Error rejecting friend request", err);
            }
        })();
    };

    const handleSwipedRight = (cardIndex: number) => {
        // right = accept
        handleAccept(cardIndex);
    };

    const handleSwipedLeft = (cardIndex: number) => {
        // left = reject
        handleReject(cardIndex);
    };

    if (loading) {
        return <LoadingScreen />;
    }

    if (requests.length === 0 || hasSwipedAll) {
        return (
            <View className="flex-1 justify-center items-center bg-colors-background">
                <Text className="text-white text-lg mb-2">No pending friend requests</Text>
                <Text className="text-white/70 text-sm text-center px-10">
                    When someone swipes right on you, their request will appear here.
                </Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-colors-background ">
            <Swiper
                cards={requests}
                renderCard={(req: PendingFriendRequest) => {
                    if (!req) return null;

                    return (
                        <MatchMakingCard
                            name={req.display_name}
                            imageUrls={[req.pp_url ?? "", ...(req.photo_urls ?? [])]}
                            major={req.major_name ?? null}
                            year={req.year ?? null}
                        />
                    );
                }}
                onSwipedLeft={handleSwipedLeft} // reject
                onSwipedRight={handleSwipedRight} // accept
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
