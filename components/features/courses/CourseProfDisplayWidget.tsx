import { parseLastName } from "@/lib/utillities";
import { CourseProfDisplay } from "@/services/courseService";
import React from "react";
import { Text, View } from "react-native";

const CourseProfDisplayWidget = (item: CourseProfDisplay) => {
    return (
        <View
            key={item.course_prof_id}
            className="flex flex-row gap-2 items-center bg-colors-secondary p-2 rounded-md"
        >
            <View>
                <Text className="font-semibold text-colors-text text-xl text-center">{item.course_code}</Text>
                <Text className="text-colors-textSecondary text-xl text-center">{parseLastName(item.prof_name)}</Text>
            </View>
        </View>
    );
};

export default CourseProfDisplayWidget;
