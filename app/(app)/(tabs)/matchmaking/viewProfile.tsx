import { colors } from "@/assets/colors";
import MatchMakingCard from "@/components/MatchMakingCard";
import { HeaderButton } from "@/components/ui/Buttons";
import { LoadingRightHeader } from "@/components/ui/Loading";
import { getParam } from "@/lib/utillities";
import { blockUser, getBlockStatus, unblockUser } from "@/services/blockingService";
import { checkStatus, FriendshipStatus, removeFriend, sendFriendRequest } from "@/services/friendshipsService";
import { getProfileByUserId, Profile } from "@/services/profileService";
import { Stack } from "expo-router";
import { useLocalSearchParams, useRouter } from "expo-router/build/hooks";
import React, { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";

const ViewProfile = () => {
    const params = useLocalSearchParams();
    const router = useRouter();

    const fallbackDisplayName = getParam(params.display_name);
    const fallbackPpUrl = getParam(params.pp_url);
    const fallbackMajor = getParam(params.major);
    const fallbackYear = getParam(params.year);
    const user_id = getParam(params.user_id);
    const bio = getParam(params.bio);
    const photoUrlsParam = getParam(params.photo_urls);
    const photoUrls = photoUrlsParam ? JSON.parse(photoUrlsParam) : [];

    const [friendShipStatus, setFriendShipStatus] = useState<FriendshipStatus>(FriendshipStatus.error);
    const [topRightLoading, setTopRightLoading] = useState(false);
    const [profileUnavailable, setProfileUnavailable] = useState(false);
    const [blockState, setBlockState] = useState({
        i_blocked: false,
        blocked_me: false,
        any_block: false,
    });
    const [profile, setProfile] = useState<Profile | null>(null);

    const loadPage = async () => {
        try {
            const status = await getBlockStatus(user_id);
            setBlockState(status);

            const fetchedProfile = await getProfileByUserId(user_id);
            setProfile(fetchedProfile);
            setProfileUnavailable(!fetchedProfile);

            if (!status.any_block) {
                const friendshipStatus = await checkStatus(user_id);
                setFriendShipStatus(friendshipStatus);
            }
        } catch (err) {
            console.error("ViewProfile load:", err);
            setProfileUnavailable(true);
        }
    };

    useEffect(() => {
        loadPage();
    }, [user_id]);

    const removeFriendPress = async () => {
        setTopRightLoading(true);
        const succ = await removeFriend(user_id);
        if (succ) {
            setFriendShipStatus(FriendshipStatus.none);
        }
        setTopRightLoading(false);
    };

    const addFriendPress = async () => {
        setTopRightLoading(true);
        const succ = await sendFriendRequest(user_id);
        if (succ) {
            setFriendShipStatus(FriendshipStatus.pendingSent);
        }
        setTopRightLoading(false);
    };

    const acceptRequestPress = () => {
        router.push("/(tabs)/social/requests");
    };

    const cancelRequestPress = () => {};

    const handleBlockToggle = async () => {
        try {
            setTopRightLoading(true);

            if (blockState.i_blocked) {
                await unblockUser(user_id);
                Alert.alert("User unblocked", "You can interact with this user again.");
            } else {
                await blockUser(user_id);
                Alert.alert("User blocked", "This user is removed from matchmaking and messaging.");
            }

            await loadPage();
        } catch (error: any) {
            Alert.alert("Error", error?.message ?? "Failed to update block status");
        } finally {
            setTopRightLoading(false);
        }
    };

    const renderFriendAction = () => {
        if (blockState.any_block) return null;
        if (topRightLoading) return <LoadingRightHeader />;

        if (friendShipStatus == FriendshipStatus.friends) {
            return <HeaderButton text="Remove Friend" iconName="person-remove" onPress={removeFriendPress} />;
        }

        if (friendShipStatus == FriendshipStatus.pendingAccept) {
            return <HeaderButton text="Accept Request" iconName="checkmark" onPress={acceptRequestPress} />;
        }

        if (friendShipStatus == FriendshipStatus.pendingSent) {
            return <HeaderButton text="Pending" iconName="hourglass" onPress={cancelRequestPress} />;
        }

        if (friendShipStatus == FriendshipStatus.none) {
            return <HeaderButton text="Add Friend" iconName="person-add" onPress={addFriendPress} />;
        }

        return null;
    };

    const renderRightHeader = () => {
        if (topRightLoading) return <LoadingRightHeader />;

        return (
            <View className="flex-row items-center gap-2">
                {renderFriendAction()}
                {!blockState.blocked_me && (
                    <HeaderButton
                        text={blockState.i_blocked ? "Unblock" : "Block"}
                        iconName={blockState.i_blocked ? "lock-open" : "ban"}
                        onPress={handleBlockToggle}
                    />
                )}
            </View>
        );
    };

    const displayName = profile?.display_name ?? fallbackDisplayName;
    const ppUrl = profile?.pp_url ?? fallbackPpUrl;
    const majorName = typeof profile?.major === "object" ? profile.major?.name ?? "" : fallbackMajor;
    const year = profile?.year ?? fallbackYear;

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: "",
                    headerStyle: { backgroundColor: colors.background },
                    headerBackVisible: true,
                    headerRight: renderRightHeader,
                }}
            />
            <View className="bg-colors-background flex-1 p-4 pt-14 justify-center">
                {profileUnavailable ? (
                    <Text className="text-center text-colors-textSecondary text-lg">This profile is unavailable.</Text>
                ) : (
                    <MatchMakingCard name={display_name} major={major} year={year} bio={bio} imageUrls={[pp_url, ...photoUrls].filter(Boolean)} />

                )}
            </View>
        </>
    );
};

export default ViewProfile;
