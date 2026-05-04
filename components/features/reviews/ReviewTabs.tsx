// ReviewTabs.tsx
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import React from "react";

import { colors } from "@/assets/colors";
import { useProfileGate } from "@/services/ProfileProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminReviewScreen from "./AdminReviewScreen";
import SearchReviewsScreen from "./SearchReviewsScreen";
import YourReviewsScreen from "./WriteReviewScreen";

const Tab = createMaterialTopTabNavigator();

export default function ReviewTabs() {
    const { isAdmin } = useProfileGate();

    return (
        <SafeAreaView className="flex-1 bg-colors-background" edges={["top", "left", "right"]}>
            <Tab.Navigator
                screenOptions={{
                    tabBarLabelStyle: { fontSize: 14, fontWeight: "600", color: colors.text },
                    tabBarIndicatorStyle: { backgroundColor: colors.secondary },
                    tabBarStyle: { backgroundColor: colors.background },
                }}
            >
                <Tab.Screen name="SearchReviews" component={SearchReviewsScreen} options={{ title: "Search" }} />
                <Tab.Screen name="WriteReview" component={YourReviewsScreen} options={{ title: "Your Reviews" }} />
                {isAdmin && (
                    <Tab.Screen name="AdminReviews" component={AdminReviewScreen} options={{ title: "Admin" }} />
                )}
            </Tab.Navigator>
        </SafeAreaView>
    );
}
