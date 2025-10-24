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


 
type CreateProfileInput = {
    displayName: string;
    majorId: number; 
    year: string;
    ppUrl?: string;
    ppFile?: File | Blob;
};

// function to get profile inputs from the frontend
export async function createProfile(input: CreateProfileInput): Promise<Profile>{
    //checking whos signed in
    const {data: u, error: authErr} = await supabase.auth.getUser();
    if(authErr) throw authErr;
    const user_id = u?.user?.id; 
    if(!user_id) throw new Error("No user Active");

    // uploading Profile_pic file and grabbing url
    let finalUrl = input.ppUrl;
    if(!finalUrl && input.ppFile){
        finalUrl = await uploadProfilePics(input.ppFile);
    }

    //building new row into the table
    const payload = {
        user_id,
        display_name: input.displayName,
        major_id: input.majorId,
        year: input.year,
        ...(finalUrl ? {pp_url: finalUrl } : {}), 
    };

    // return a joined row for profile
    const {data, error} = await supabase
        .from(TABLES.PROFILES) 
        .upsert(payload, { onConflict: "user_id"})
        .select(`user_id, display_name, major:majors!profiles_major_id_fkey(id, name), year, pp_url`)
        .single();

        if (error) throw error;

        const major = (data as any).major;
        
        const result: Profile = {
            user_id: data.user_id,
            display_name: data.display_name,
            year: data.year,
            pp_url: data.pp_url ?? undefined,
            major: {id:major.id,name:major.name},
        };

        return result;
        
}

function getExt(name?: string, mime?: string):string{
    return(
        name?.split(".").pop()?.toLowerCase() ||
        mime?.split("/")[1]?.toLowerCase() ||
        "png"
    );
}

// adds profile picture into profile_pics public bucket and then gets the pp_url and adds it to the profiles table
export const BUCKETS = {PROFILE_PICS: 'profile-pictures'} as const;
export async function uploadProfilePics(file: File | Blob): Promise<string>{
    // whos signed in
    const { data: u, error: authErr} = await supabase.auth.getUser(); 
    if (authErr) throw authErr;
    const userId = u?.user?.id;
    if (!userId) throw new Error("No user logged in");

    // creating unique path
    const f: any = file;
    const name: string | undefined = typeof f?.name === 'string' && f.name ? f.name : undefined;
    let mime: string | undefined = typeof f?.type === 'string' && f.type ? f.type : undefined;
    if(!mime) mime = "image/jpeg"; 

    const ext = getExt(name, mime);
    const filePath = `${userId}/avatar-${Date.now()}.${ext}`;

    // add to bucket
    const { error: uploadError } = await supabase.storage
    .from(BUCKETS.PROFILE_PICS)
    .upload(filePath, file, { 
        upsert: true, 
        contentType: mime || `image/${ext}`,
    });
    if (uploadError) throw uploadError;

    //grabbing public url
    const { data: publicData} = supabase.storage
    .from(BUCKETS.PROFILE_PICS)
    .getPublicUrl(filePath);

    const publicUrl = publicData.publicUrl;
    if (!publicUrl) throw new Error("Failed to generate public url");

    return publicUrl;
};

