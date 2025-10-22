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

export const getUserProfile = async (
    userId: string | null
): Promise<Profile | null> => {
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

export const hasProfile = async (userId: string): Promise<boolean> => {
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



// 
type CreateProfileInput = {
    displayName: string;
    majorId: string | number;
    year: string;
    ppUrl?: string | undefined;
};


// function to get profile inputs from the frontend
//                                       
export async function createProfile(input: CreateProfileInput): Promise<Profile>{
    //checking whos signed in
    const {data: u, error: authErr} = await supabase.auth.getUser();
    if(authErr) throw authErr;
    const user_id = u?.user?.id;  // if no one is signed in, user_id becomes Undefined instead of crashing 
    if(!user_id) throw new Error("No user Active");

    //building new row into the table
    const payload = {
        user_id,
        display_name: input.displayName,
        major_id: input.majorId,
        year: input.year,
        pp_url: input.ppUrl ?? null, // grabs pfp if available 
    };

    // return a joined row for profile
    const {data, error} = await supabase
        .from(TABLES.PROFILES) //"profiles"
        .upsert(payload, { onConflict: "user_id"})
        .select(`user_id, display_name, major:majors!profiles_major_id_fkey(id, name), year, pp_url`)
        .single();

        if (error) throw error;

        const major = (data as any).major;
        /*
        if(!major || Array.isArray(major)){
            throw new Error("Profile must have a single major.");
        }
        */

        const result: Profile = {
            user_id: data.user_id,
            display_name: data.display_name,
            year: data.year,
            pp_url: data.pp_url ?? undefined,
            major: {id:major.id,name:major.name},
        };

        return result;
}

