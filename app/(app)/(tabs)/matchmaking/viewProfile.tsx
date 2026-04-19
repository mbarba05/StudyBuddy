import { colors } from "@/assets/colors";
import MatchMakingCard from "@/components/MatchMakingCard";
import { HeaderButton } from "@/components/ui/Buttons";
import { LoadingRightHeader } from "@/components/ui/Loading";
import { getParam } from "@/lib/utillities";
import { checkStatus, FriendshipStatus, removeFriend, sendFriendRequest } from "@/services/friendshipsService";
import { Stack } from "expo-router";
import { useLocalSearchParams, useRouter } from "expo-router/build/hooks";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

const ViewProfile = () => {
    const params = useLocalSearchParams();
    const router = useRouter();

    const display_name = getParam(params.display_name);
    const pp_url = getParam(params.pp_url);
    const major = getParam(params.major);
    const year = getParam(params.year);
    const user_id = getParam(params.user_id);
    const bio = getParam(params.bio);
    const photoUrlsParam = getParam(params.photo_urls);
    const photoUrls = photoUrlsParam ? JSON.parse(photoUrlsParam) : [];

    const [friendShipStatus, setFriendShipStatus] = useState<FriendshipStatus>(FriendshipStatus.error);
    const [topRightLoading, setTopRightLoading] = useState(false);

    useEffect(() => {
        const checkFriendShipStatus = async () => {
            const status = await checkStatus(user_id);
            console.log("STATUS", status);
            setFriendShipStatus(status);
        };

        checkFriendShipStatus();
    }, []);

    const removeFriendPress = async () => {
        setTopRightLoading(true);
        const succ = await removeFriend(user_id);
        if (succ) {
            setFriendShipStatus(FriendshipStatus.none);
        } else {
            //TODO: error message
        }
        setTopRightLoading(false);
    };

    const addFriendPress = async () => {
        setTopRightLoading(true);
        const succ = await sendFriendRequest(user_id);
        if (succ) {
            setFriendShipStatus(FriendshipStatus.pendingSent);
        } else {
            //TODO: error message
        }
        setTopRightLoading(false);
    };

    const acceptRequestPress = () => {
        router.push("/(tabs)/social/requests");
    };

    const cancelRequestPress = () => {};

    const renderRightHeader = () => {
        if (topRightLoading) return <LoadingRightHeader />;
        //remove friend
        if (friendShipStatus == FriendshipStatus.friends) {
            return <HeaderButton text="Remove Friend" iconName="person-remove" onPress={removeFriendPress} />;
        }

        //accept request
        if (friendShipStatus == FriendshipStatus.pendingAccept) {
            return <HeaderButton text="Accept Request" iconName="checkmark" onPress={acceptRequestPress} />; //TODO: reject button
        }

        //unsend request
        if (friendShipStatus == FriendshipStatus.pendingSent) {
            return <HeaderButton text="Pending" iconName="hourglass" onPress={cancelRequestPress} />;
        }

        //send request
        if (friendShipStatus == FriendshipStatus.none) {
            return <HeaderButton text="Add Friend" iconName="person-add" onPress={addFriendPress} />;
        }

        //return something that does nothing when error or yourself
        return;
    };

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
                <MatchMakingCard name={display_name} major={major} year={year} bio={bio} imageUrls={[pp_url, ...photoUrls].filter(Boolean)} />
            </View>
        </>
    );
};

export default ViewProfile;
