/*import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
    return (
        <SafeAreaView
            className="flex-1 bg-colors-background"
            edges={["top", "left", "right"]}
        ></SafeAreaView>
    );
}
    */
import { colors } from "@/assets/colors";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
    return (
        <SafeAreaView className="flex-1 bg-colors-background" edges={["top", "left", "right"]}>
            <View className="flex-1 px-6 py-6">
                {/* Header */}
                <View className="mb-8">
                    <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
                        Welcome to StudyBuddy
                    </Text>
                    <Text className="text-base" style={{ color: colors.text, opacity: 0.7 }}>
                        Connect with classmates, rate your classes, and keep up with friends.
                    </Text>
                </View>

                {/* Highlight card */}
                <View
                    className="rounded-3xl p-5 mb-8 border border-colors-text"
                    style={{ backgroundColor: colors.secondary }}
                >
                    <Text className="text-lg font-semibold mb-1" style={{ color: colors.text }}>
                        Ready to study smarter?
                    </Text>
                    <Text className="text-sm" style={{ color: colors.text, opacity: 0.8 }}>
                        Jump into reviews, find new study partners, or check in with your friends.
                    </Text>
                </View>

                {/* Actions */}
                <View className="gap-4">
                    {/* Leave Reviews */}
                    <Link href="/(tabs)/reviews" asChild>
                        <TouchableOpacity
                            className="flex-row items-center justify-between py-3 px-4 rounded-2xl border border-colors-text"
                            style={{ backgroundColor: colors.secondary }}
                        >
                            <View>
                                <Text className="text-lg font-semibold " style={{ color: colors.text }}>
                                    Leave Reviews
                                </Text>
                                <Text className="text-xs mt-1" style={{ color: colors.text, opacity: 0.8 }}>
                                    Share your thoughts on professors and classes.
                                </Text>
                            </View>
                            <Ionicons name="pencil" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </Link>

                    {/* Match with Students */}
                    <Link href="/(tabs)/matchmaking" asChild>
                        <TouchableOpacity
                            className="flex-row items-center justify-between py-3 px-4 rounded-2xl border border-colors-text"
                            style={{ backgroundColor: colors.secondary }}
                        >
                            <View>
                                <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                                    Match with Students
                                </Text>
                                <Text className="text-xs mt-1" style={{ color: colors.text, opacity: 0.8 }}>
                                    Find classmates with similar schedules and majors.
                                </Text>
                            </View>
                            <Ionicons name="heart" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </Link>

                    {/* Chat with Friends */}
                    <Link href="/(tabs)/social" asChild>
                        <TouchableOpacity
                            className="flex-row items-center justify-between py-3 px-4 rounded-2xl border border-colors-text"
                            style={{ backgroundColor: colors.secondary }}
                        >
                            <View>
                                <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                                    Chat with Friends
                                </Text>
                                <Text className="text-xs mt-1" style={{ color: colors.text, opacity: 0.8 }}>
                                    Keep in touch with your study group.
                                </Text>
                            </View>
                            <Ionicons name="chatbox" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </Link>

                    {/* Edit Profile */}
                    <Link href="/(tabs)/profile" asChild>
                        <TouchableOpacity
                            className="flex-row items-center justify-between py-3 px-4 rounded-2xl border border-colors-text"
                            style={{ backgroundColor: colors.secondary }}
                        >
                            <View>
                                <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                                    Edit Profile
                                </Text>
                                <Text className="text-xs mt-1" style={{ color: colors.text, opacity: 0.8 }}>
                                    Update your major, classes, and preferences.
                                </Text>
                            </View>
                            <Ionicons name="person-circle" size={26} color={colors.text} />
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </SafeAreaView>
    );
}
