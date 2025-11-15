import { parseLastName } from "@/lib/utillities";
import React from "react";
import { Text, View } from "react-native";

interface CourseProfDisplayWidgetProps {
    code: string;
    name: string;
    term?: string;
}

const CourseProfDisplayWidget = ({ code, name, term }: CourseProfDisplayWidgetProps) => {
    return (
        <View className="flex flex-row gap-2 items-center bg-colors-secondary p-2 rounded-md">
            <View>
                <Text className="font-semibold text-colors-text text-xl text-center">{code}</Text>
                <Text className="text-colors-textSecondary text-xl text-center">{parseLastName(name)}</Text>
                {term && <Text className="text-colors-textSecondary text-lg ml-2">{term}</Text>}
            </View>
        </View>
    );
};

export default CourseProfDisplayWidget;
