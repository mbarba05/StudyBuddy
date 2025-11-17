import { colors } from "@/assets/colors";
import { parseLastName } from "@/lib/utillities";
import { ReviewDisplay } from "@/services/reviewsService";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ReviewWidgetProps {
    review: ReviewDisplay;
}

const ReviewWidget = ({ review }: ReviewWidgetProps) => {
    return (
        <View className="bg-colors-secondary w-[90vw] rounded-lg border border-colors-text p-2 gap-4">
            <View className="flex-row justify-between">
                <View>
                    <Text className="color-colors-text text-2xl font-semibold">{review.code}</Text>
                    <Text className="color-colors-textSecondary text-lg">{parseLastName(review.profName)}</Text>
                </View>
                <View>
                    <Text className="color-colors-text text-2xl font-semibold">{review.term}</Text>
                    <Text className="color-colors-textSecondary text-lg text-right">
                        {parseLastName(review.reviewDate)}
                    </Text>
                </View>
            </View>
            <View>
                <Text className="color-colors-text text-center text-lg">{review.reviewText}</Text>
            </View>
            <View className="flex flex-row justify-between">
                <View className="flex items-center">
                    <Text className="color-colors-textSecondary text-lg">Difficulty</Text>
                    <Text className="color-colors-text text-2xl font-semibold">{review.courseDiff}/10</Text>
                </View>
                <View className="flex items-center">
                    <Text className="color-colors-textSecondary text-lg">Quality</Text>
                    <Text className="color-colors-text text-2xl font-semibold">{review.profRating}/10</Text>
                </View>
                <View className="flex items-center">
                    <Text className="color-colors-textSecondary text-lg">Grade</Text>
                    <Text className="color-colors-text text-2xl font-semibold">{review.grade}</Text>
                </View>
            </View>
            <View className="flex flex-row justify-between border-colors-textSecondary border-t pt-2">
                <View className="flex-row gap-4 items-center">
                    <TouchableOpacity className="flex-row gap-1 items-center">
                        <Ionicons
                            name="chatbox-outline"
                            color={colors.text}
                            size={24}
                        />
                        <Text className="color-colors-text text-lg">1</Text>
                        {/*TODO: add comment section*/}
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Ionicons
                            name="paper-plane-outline"
                            color={colors.text}
                            size={24}
                        />
                    </TouchableOpacity>
                    {/*TODO: add sharing posts*/}
                </View>
                <View className="flex-row gap-2 items-center">
                    <TouchableOpacity>
                        <Ionicons
                            name="arrow-up-circle"
                            color={colors.text}
                            size={28}
                        />
                    </TouchableOpacity>
                    <Text className="color-colors-text text-lg">1</Text>
                    <TouchableOpacity>
                        <Ionicons
                            name="arrow-down-circle"
                            color={colors.text}
                            size={28}
                        />
                    </TouchableOpacity>
                    {/*TODO: add liking posts*/}
                </View>
            </View>
        </View>
    );
};

export default ReviewWidget;
