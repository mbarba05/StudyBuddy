import { TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/subapase";

export type MajorDropDownItem = { label: string; value: number };

export const getAllMajorsForDropdown = async (): Promise<
    MajorDropDownItem[]
> => {
    const { data, error } = await supabase
        .from(TABLES.MAJORS)
        .select("id, name")
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching majors:", error);
        return [];
    }

    // map to DropDownPicker format
    console.log(data);
    return (data ?? []).map((m) => ({ label: m.name, value: m.id }));
};
