import LoadingScreen from "@/components/ui/LoadingScreen";
import {
    getAllMajorsForDropdown,
    MajorDropDownItem,
} from "@/services/majorsService";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

const EditProfileForm = () => {
    const [majorOpen, setMajorOpen] = useState(false);
    const [majorValue, setMajorValue] = useState<number | null>(null);
    const [majorOptions, setMajorOptions] = useState<MajorDropDownItem[]>([]); // [{label, value}]
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        //gets all major options
        let mounted = true;
        (async () => {
            const majors = await getAllMajorsForDropdown();
            if (mounted) {
                setMajorOptions(majors);
                setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    if (loading) return <LoadingScreen />;

    return (
        <View className="w-1/2">
            {/* className doesnt work on DropDownPicker, so use style props for it
                apparently we can use tailwind in style={} by doing this:
                style={tw.style('border border-gray-200 rounded-lg')}
                the view around the dropdown is the easiest way to change the size */}
            <DropDownPicker
                open={majorOpen}
                value={majorValue}
                items={majorOptions}
                setOpen={setMajorOpen}
                setValue={setMajorValue}
                setItems={setMajorOptions}
                searchable
                searchPlaceholder="Search Majors"
                placeholder="Choose Major"
            />
        </View>
    );
};

export default EditProfileForm;
