//import supabase from "@/lib/subapase";
//here we put all the supabase api interactions,
//i think it would be easiest to split them by data model
//(profile, reviews, classes, professors)

import { BUCKETS, TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/subapase";
import { Major } from "./majorsService";

export interface Profile {
    user_id: string;
    display_name: string;
    major: Major;
    year: string | null;
    pp_url: string | null;
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
        //                              ^ join majors by foreign key
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

    return data as Profile;
};

export const hasProfile = async (userId: string): Promise<boolean> => {
    const { data, count, error } = await supabase
        .from(TABLES.PROFILES)
        .select("user_id", { count: "exact", head: true })
        .eq("user_id", userId);

    if (error) {
        console.error("Error fetching profile:", error, data);
        return false;
    }

    const exists = (count ?? 0) > 0;
    if (!exists) console.log("User does not have a profile");

    return exists;
};

type CreateProfileInput = {
    displayName: string;
    majorId: number;
    year: string;
    ppUrl?: string; // can be file:// or public URL
};

// function to get profile inputs from the frontend
export async function createProfile(
    input: CreateProfileInput
): Promise<Profile> {
    //checking whos signed in
    const { data: u, error: authErr } = await supabase.auth.getUser();
    if (authErr) throw authErr;
    const user_id = u?.user?.id;
    if (!user_id) throw new Error("No user Active");

    //uploading Profile_pic file and grabbing url
    let finalUrl: string | undefined = undefined;
    if (input.ppUrl) {
        if (isLocalUri(input.ppUrl)) {
            finalUrl = await uploadProfilePics({
                uri: input.ppUrl,
                name: "avatar.jpg",
                type: "image/jpeg",
            });
        } else {
            // Already a public URL
            finalUrl = input.ppUrl;
        }
    }

    //building new row into the table
    const payload = {
        user_id,
        display_name: input.displayName,
        major_id: input.majorId,
        year: input.year,
        ...(finalUrl ? { pp_url: finalUrl } : {}),
    };

    // return a joined row for profile
    const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .upsert(payload, { onConflict: "user_id" })
        .select(
            `user_id, display_name, major:majors!profiles_major_id_fkey(id, name), year, pp_url`
        )
        .single();

    if (error) throw error;

    const major = (data as any).major;

    const result: Profile = {
        user_id: data.user_id,
        display_name: data.display_name,
        year: data.year,
        pp_url: data.pp_url ?? null,
        major: { id: major.id, name: major.name },
    };

    return result;
}

function getExt(name?: string, mime?: string): string {
    return (
        name?.split(".").pop()?.toLowerCase() ||
        mime?.split("/")[1]?.toLowerCase() ||
        "png"
    );
}

function isLocalUri(uri?: string) {
    return !!uri && (uri.startsWith("file://") || uri.startsWith("content://"));
}

// adds profile picture into profile_pics public bucket and then gets the pp_url and adds it to the profiles table
type RNFile = { uri: string; name?: string; type?: string };

export async function uploadProfilePics(
    file: File | Blob | RNFile
): Promise<string> {
    const { data: u, error: authErr } = await supabase.auth.getUser();
    if (authErr) throw authErr;
    const userId = u?.user?.id;
    if (!userId) throw new Error("No user logged in");

    let name: string | undefined;
    let mime: string | undefined;
    let body: Blob | File | Uint8Array;

    if ((file as RNFile)?.uri) {
        const asset = file as RNFile;
        name = asset.name;
        mime = asset.type;
        // React Native-safe: use arrayBuffer instead of blob()
        const resp = await fetch(asset.uri);
        const arrayBuffer = await resp.arrayBuffer();
        body = new Uint8Array(arrayBuffer);
    } else {
        const f: any = file;
        name = typeof f?.name === "string" ? f.name : undefined;
        mime = typeof f?.type === "string" ? f.type : undefined;
        body = file as Blob | File;
    }

    if (!mime) mime = "image/jpeg";
    const ext = getExt(name, mime);
    const filePath = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
        .from(BUCKETS.PROFILE_PICS)
        .upload(filePath, body, { upsert: true, contentType: mime });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage
        .from(BUCKETS.PROFILE_PICS)
        .getPublicUrl(filePath);

    const publicUrl = publicData.publicUrl;
    if (!publicUrl) throw new Error("Failed to generate public url");
    return publicUrl;
}

type EditProfileInput = {
    display_name?: string; // string or undefined -> not provided
    major?: number | null; // number|null|undefined
    pp_url?: string | null; // if string and local (file://), we upload; if null, we clear; if undefined, ignore
    year?: string | null;
};

/**
 * Updates profile fields and uploads a new profile picture to Supabase Storage
 * if a local file URI is provided in `pp_url`.
 *
 * @param userId string
 * @param updates EditProfileInput
 * @returns Profile (joined with majors)
 */
export async function editProfile(
    userId: string,
    updates: EditProfileInput
): Promise<Profile> {
    if (!userId) throw new Error("No user id provided");

    const payload: Record<string, any> = {};

    // Only include keys that are explicitly provided (including null)
    if (updates.display_name !== undefined)
        payload.display_name = updates.display_name;
    if (updates.major !== undefined) payload.major_id = updates.major; // can be null to clear
    if (updates.year !== undefined) payload.year = updates.year; // can be null/empty

    // Handle profile picture:
    // - If undefined: leave unchanged.
    // - If null: clear pp_url.
    // - If string and local (file:// or content://): upload and set public URL.
    // - If string and remote (http/https): set as-is.
    if (updates.pp_url !== undefined) {
        if (updates.pp_url === null) {
            payload.pp_url = null;
        } else if (isLocalUri(updates.pp_url)) {
            const publicUrl = await uploadProfilePics({
                uri: updates.pp_url,
                name: "avatar.jpg",
                type: "image/jpeg",
            });
            payload.pp_url = publicUrl;
        } else {
            payload.pp_url = updates.pp_url; // already a public URL
        }
    }

    const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .update(payload)
        .eq("user_id", userId)
        .select(
            `user_id, display_name, major:majors!profiles_major_id_fkey(id, name), year, pp_url`
        )
        .single();

    if (error) throw error;

    const major = (data as any).major;

    const result: Profile = {
        user_id: data.user_id,
        display_name: data.display_name,
        year: data.year ?? null,
        pp_url: data.pp_url ?? null,
        major: { id: major?.id, name: major?.name },
    };

    return result;
}

// fetch all profiles from the profiles table
export async function getAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      user_id,
      display_name,
      year,
      pp_url,
      major:major_id (name)
    `);

  if (error) {
    console.error("Error fetching profiles:", error);
    return [];
  }

  return data || [];
}