import MatchMakingCard from "@/components/MatchMakingCard";
import { getParam } from "@/lib/utillities";
import { checkStatus, FriendshipStatus } from "@/services/friendshipsService";
import { useLocalSearchParams } from "expo-router/build/hooks";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

const ViewProfile = () => {
    const params = useLocalSearchParams();

    const display_name = getParam(params.display_name);
    const pp_url = getParam(params.pp_url);
    const major = getParam(params.major);
    const year = getParam(params.year);
    const user_id = getParam(params.user_id);

    const [friendShipStatus, setFriendShipStatus] = useState<FriendshipStatus>(FriendshipStatus.error);

    useEffect(() => {
        const checkFriendShipStatus = async () => {
            const status = await checkStatus(user_id);
            console.log("STATUS", status);
            setFriendShipStatus(status);
        };

        checkFriendShipStatus();
    }, []);

    const RightHeader = () => {
        //remove friend
        if (friendShipStatus == FriendshipStatus.friends) {
        }

        //accept request
        if (friendShipStatus == FriendshipStatus.pendingAccept) {
        }

        //unsend request
        if (friendShipStatus == FriendshipStatus.pendingSent) {
        }

        //send request
        if (friendShipStatus == FriendshipStatus.none) {
        }

        //return something that does nothing when error or yourself
        return;
    };

    return (
        <View className="bg-colors-background flex-1 p-4 justify-center">
            <MatchMakingCard name={display_name} imageUrl={pp_url} major={major} year={year} />
        </View>
    );
};

export default ViewProfile;
