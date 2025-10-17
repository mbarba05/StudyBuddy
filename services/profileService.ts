//import supabase from "@/lib/subapase";
//here we put all the supabase api interactions,
//i think it would be easiest to split them by data model
//(profile, reviews, classes, professors)

import { TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/subapase";
import { Major } from "./majorsService";

export interface Profile {
    user_id: string;
    display_name: string;
    major: Major;
    year: string;
    pp_url: string | undefined;
}

export const getUserProfile = async (): Promise<Profile | null> => {
    const {
        data: { session },
        error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) {
        console.error("Error getting session:", sessionError);
        return null;
    }

    const userId = session?.user?.id;
    if (!userId) {
        console.warn("No user in session");
        return null;
    }
    let { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select("user_id, display_name, major:majors(id, name), year, pp_url")
        //                              ^ this is how we do joins since we only had major_id in profile table
        .eq("user_id", userId)
        .single();

    if (error) {
        console.error("Error fetching profile:", error);
        return null;
    }

    if (!data) {
        console.log("User does not have a profile");
        return null;
    }

    return data;
};

export const hasProfileByUserId = async (userId: string): Promise<boolean> => {
    const { data, count, error } = await supabase
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("user_id", userId);

    if (error) {
        console.error("Error fetching profile:", error);
        return false;
    }

    // When using { head: true }, count tells you how many rows match
    const exists = (count ?? 0) > 0;
    if (!exists) console.log("User does not have a profile");

    return exists;
};
