import { colors } from "@/assets/colors";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type HomeCardProps = {
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    href: "/(tabs)/reviews" | "/(tabs)/matchmaking" | "/(tabs)/social" | "/(tabs)/profile";
    iconBackgroundColor: string;
};

function HomeCard({ title, description, icon, href, iconBackgroundColor }: HomeCardProps) {
    return (
        <Link href={href} asChild>
            <TouchableOpacity
                activeOpacity={0.85}
                className="rounded-[28px] px-5 py-5 mb-5 border"
                style={{
                    backgroundColor: "#013c8f",
                    borderColor: "#1f63c7",
                    shadowColor: "#000",
                    shadowOpacity: 0.18,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 4,
                }}
            >
                <View className="flex-row items-center">
                    <View
                        className="w-16 h-16 rounded-2xl items-center justify-center"
                        style={{ backgroundColor: iconBackgroundColor }}
                    >
                        <Ionicons name={icon} size={30} color={colors.text} />
                    </View>

                    <View
                        className="mx-4"
                        style={{
                            width: 1,
                            height: 54,
                            backgroundColor: "#2c72dc",
                        }}
                    />

                    <View className="flex-1 pr-4">
                        <Text className="text-[22px] font-bold" style={{ color: colors.text }}>
                            {title}
                        </Text>
                        <Text className="text-base mt-1" style={{ color: "#c7d2e5" }}>
                            {description}
                        </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={28} color={colors.text} />
                </View>
            </TouchableOpacity>
        </Link>
    );
}

export default function HomeScreen() {
    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={["top", "left", "right"]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 18,
                    paddingBottom: 28,
                }}
            >
                {/* Header */}
                <View className="items-center mb-8">
                    <Image
                        testID="home-logo"
                        source={require("@/assets/images/studybuddy-logo.png")}
                        style={{
                            width: 145,
                            height: 145,
                            marginBottom: 6,
                        }}
                        resizeMode="contain"
                    />

                    <Text className="text-[44px] font-bold leading-[48px]" style={{ color: colors.text }}>
                        Study
                        <Text style={{ color: colors.primary }}>Buddy</Text>
                    </Text>

                    <Text
                        className="text-xl mt-2 text-center px-6"
                        style={{ color: "#b9c4d8" }}
                    >
                        Study together. Achieve more.
                    </Text>
                </View>

                {/* Top hero card */}
                <View
                    className="rounded-[28px] p-6 mb-6 border"
                    style={{
                        backgroundColor: "#013c8f",
                        borderColor: "#1f63c7",
                        shadowColor: "#000",
                        shadowOpacity: 0.18,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 4,
                    }}
                >
                    <Text className="text-[24px] font-bold mb-2" style={{ color: colors.text }}>
                        Ready to study smarter?
                    </Text>
                    <Text className="text-base" style={{ color: "#c7d2e5" }}>
                        Jump into reviews, find new study partners, or check in with your friends.
                    </Text>
                </View>

                {/* Cards */}
                <HomeCard
                    title="Reviews"
                    description="Rate and review your study sessions"
                    icon="star"
                    href="/(tabs)/reviews"
                    iconBackgroundColor={colors.secondary}
                />

                <HomeCard
                    title="Matchmaking"
                    description="Find the perfect study buddy for you"
                    icon="heart"
                    href="/(tabs)/matchmaking"
                    iconBackgroundColor={colors.primary}
                />

                <HomeCard
                    title="Messages"
                    description="Chat with your study buddies"
                    icon="chatbubble"
                    href="/(tabs)/social"
                    iconBackgroundColor={colors.secondary}
                />

                <HomeCard
                    title="Profile"
                    description="View and manage your profile"
                    icon="person"
                    href="/(tabs)/profile"
                    iconBackgroundColor={colors.primary}
                />

                {/* Study streak */}
                <View
                >
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}