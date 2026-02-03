// app/(app)/(tabs)/social.tsx
import MatchMakingCard from "@/components/MatchMakingCard";
import LoadingScreen from "@/components/ui/LoadingScreen";
import {
    acceptFriendRequest,
    FriendRequest,
    getIncomingFriendRequests,
    rejectFriendRequest,
} from "@/services/friendshipsService";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Swiper from "react-native-deck-swiper";

export type IncomingFriendRequest = FriendRequest & {
    sender: {
        user_id: string;
        display_name: string;
        pp_url: string | null;
        year: string | null;
        major: { name: string } | null;
    };
};

export default function RequestsScreen() {
    const [requests, setRequests] = useState<IncomingFriendRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasSwipedAll, setHasSwipedAll] = useState(false);

    useEffect(() => {
        const loadRequests = async () => {
            try {
                const data = await getIncomingFriendRequests();
                setRequests(data as IncomingFriendRequest[]);
                setHasSwipedAll(false);
                console.log("Incoming friend requests:", data);
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
                await acceptFriendRequest(req);
                // remove this request from local state
                //setRequests((prev) => prev.filter((_, i) => i !== cardIndex));
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
                renderCard={(req: IncomingFriendRequest) => {
                    if (!req) return null;
                    const p = req.sender;

                    return (
                        <MatchMakingCard
                            name={p.display_name}
                            imageUrl={p.pp_url}
                            major={p.major?.name ?? null}
                            year={p.year ?? null}
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
