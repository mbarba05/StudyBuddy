// ReviewTabs.tsx
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import React from "react";

import { colors } from "@/assets/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchReviewsScreen from "./SearchReviewsScreen";
import YourReviewsScreen from "./WriteReviewScreen";

const Tab = createMaterialTopTabNavigator();

export default function ReviewTabs() {
    return (
        <SafeAreaView className="flex-1 bg-colors-background">
            <Tab.Navigator
                screenOptions={{
                    tabBarLabelStyle: { fontSize: 14, fontWeight: "600", color: colors.text },
                    tabBarIndicatorStyle: { backgroundColor: colors.secondary },
                    tabBarStyle: { backgroundColor: colors.background },
                }}
            >
                <Tab.Screen
                    name="SearchReviews"
                    component={SearchReviewsScreen}
                    options={{ title: "Search" }}
                />
                <Tab.Screen
                    name="WriteReview"
                    component={YourReviewsScreen}
                    options={{ title: "Your Reviews" }}
                />
            </Tab.Navigator>
        </SafeAreaView>
    );
}
