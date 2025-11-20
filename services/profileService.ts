//import supabase from "@/lib/subapase";
//here we put all the supabase api interactions,
//i think it would be easiest to split them by data model
//(profile, reviews, classes, professors)

import { BUCKETS, TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/subapase";
import { Major } from "./majorsService";

import { getSwipedUserIds } from "./swipeService";

export interface Profile {
    user_id: string;
    display_name: string;
    major: Major;
    year: string | null;
    pp_url: string | null;
}

export const getUserProfile = async (): Promise<Profile | null> => {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
        console.warn("No user in session");
        return null;
    }
    let { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select("user_id, display_name, major:majors(id, name), year, pp_url")
        //                              ^ join majors by foreign key
        .eq("user_id", user.id)
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
export async function createProfile(input: CreateProfileInput): Promise<Profile> {
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
        .select(`user_id, display_name, major:majors!profiles_major_id_fkey(id, name), year, pp_url`)
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
    return name?.split(".").pop()?.toLowerCase() || mime?.split("/")[1]?.toLowerCase() || "png";
}

function isLocalUri(uri?: string) {
    return !!uri && (uri.startsWith("file://") || uri.startsWith("content://"));
}

// adds profile picture into profile_pics public bucket and then gets the pp_url and adds it to the profiles table
type RNFile = { uri: string; name?: string; type?: string };

export async function uploadProfilePics(file: File | Blob | RNFile): Promise<string> {
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

    const { data: publicData } = supabase.storage.from(BUCKETS.PROFILE_PICS).getPublicUrl(filePath);

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
export async function editProfile(updates: EditProfileInput): Promise<Profile | null> {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
        console.warn("No user in session");
        return null;
    }
    const payload: Record<string, any> = {};

    // Only include keys that are explicitly provided (including null)
    if (updates.display_name !== undefined) payload.display_name = updates.display_name;
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
        .eq("user_id", user.id)
        .select(`user_id, display_name, major:majors!profiles_major_id_fkey(id, name), year, pp_url`)
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

// matchmaking Alg

// this is used to have users with the highest "score" show first.
export type MatchRow = Profile & {
    overlap_classes: number; // number of shared classes this term
    overlap_professors: number; // number of shared professors this term
    score: number; // sum of number of classes and professors
};

// grabbing profiles with filters (major for now)
export async function getPotentialMatches(opts?: { limit?: number; offset?: number }): Promise<Profile[]> {
    return matchMajor(opts?.limit ?? 50);
}

// spliting array of user to make processing faster
function chunk<T>(arr: T[], size = 100): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

// function to grab current user Id
async function grabCurr_UserId(): Promise<string> {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    const curr_user_id = data?.user?.id;
    if (!curr_user_id) throw new Error("No Active User");
    return curr_user_id;
}

// function to grab major id of a given user
async function grabMajorIds(user_id: string): Promise<number | null> {
    const { data, error } = await supabase.from("profiles").select("major_id").eq("user_id", user_id).maybeSingle();
    if (error) throw error;
    return data?.major_id ?? null;
}

// grabbing current user major id
export async function curr_major_id(): Promise<number | null> {
    const user_major_id = await grabCurr_UserId();
    return grabMajorIds(user_major_id);
}

// limit => the amount of profiles i grab at a time
// function grabs a most of 50 profiles that have the same major as current user
// it excludes current logged inprofile and users they have already interacted with
export async function matchMajor(limit = 50): Promise<Profile[]> {
    const user_id = await grabCurr_UserId();
    const major_id = await grabMajorIds(user_id);
    if (major_id == null) {
        return [];
    }

    // grabbing the profiles I already interated
    const swiped = await getSwipedUserIds(user_id);
    const exclude = new Set<string>(Array.isArray(swiped) ? swiped : Array.from(swiped));
    exclude.add(user_id);
    const excludeIds = Array.from(exclude);

    // making sure they have the same major as current user
    let query = supabase
        .from(TABLES.PROFILES)
        .select("user_id, created_at, display_name, major:majors(id,name), year, pp_url")
        .eq("major_id", major_id) // this the condition that checks that major is the same as current logged in user
        .order("created_at")
        .limit(limit);

    // keeping out logging in user and users they have already interated with
    // checks if the "list" that was created from getSwipedUserIds is empty
    if (excludeIds.length) {
        const csv = `(${excludeIds.join(",")})`;
        query = query.not("user_id", "in", csv);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []).map((r: any) => ({
        user_id: r.user_id as string,
        display_name: r.display_name as string,
        year: (r.year ?? null) as string | null,
        pp_url: (r.pp_url ?? null) as string | null,
        major: r.major as Major,
    }));
    // adding randomization to the list of profiles
    shuffle(rows);
    return rows;
}

// for randomization
// randomize loaded profiles
function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// gets profiles with same major for a specific term
// counts classes and professors both users are taking
// gets a score and uses score to show profiles to current user (greatest score(most overlaping) -> least score(least overlaping) )
export async function majorMatching(
    termId: number | string,
    opts?: {
        classScore?: number; // importance of shared classes (default 2)
        professorScore?: number; // importance of shared professors (default 1)
        minimumOverlap?: number; // minimum number of overlaps required
        limit?: number;
        offset?: number;
    }
): Promise<MatchRow[]> {
    const classWeight = opts?.classScore ?? 2;
    const profWeight = opts?.professorScore ?? 1;
    const minOverlap = opts?.minimumOverlap ?? 0;
    const limit = opts?.limit ?? 50;
    const offset = opts?.offset ?? 0;

    // making sure users have same major
    const user_id = await grabCurr_UserId();
    const user_major_id = await grabMajorIds(user_id);
    if (user_major_id == null) return [];

    // keeping already swiped users out
    const swiped = await getSwipedUserIds(user_id);
    const excludeSet = new Set<string>(Array.isArray(swiped) ? swiped : Array.from(swiped));
    excludeSet.add(user_id);
    const excludeIds = Array.from(excludeSet);

    // grabbing some user profiles
    let q = supabase
        .from(TABLES.PROFILES)
        .select("user_id, display_name, year, pp_url, major:majors(id,name), created_at")
        .eq("major_id", user_major_id)
        .neq("user_id", user_id) // to hid current user from swiping on themself
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (excludeIds.length) {
        const csv = "(" + excludeIds.map((id) => `"${id}"`).join(",") + ")";
        q = q.not("user_id", "in", csv);
    }

    const { data: candRows, error: candErr } = await q;
    if (candErr) throw candErr;
    if (!candRows || candRows.length === 0) return [];

    // pos = possible
    const pos_profile_ids: string[] = candRows.map((r: any) => r.user_id);

    // grabing current user classes and professors on current term
    const { data: myEnrolls, error: myEnrollErr } = await supabase
        .from("enrollments")
        .select("course_prof_id")
        .eq("user_id", user_id)
        .eq("term", termId as string);
    if (myEnrollErr) throw myEnrollErr;

    // myCpIds => my course profile ids
    const myCpIds = (myEnrolls ?? []).map((r: any) => r.course_prof_id);

    // grabbing both professor_id and course_id
    let myCourseSet = new Set<number | string>();
    let myProfSet = new Set<number | string>();

    if (myCpIds.length) {
        const { data: myCpRows, error: myCpErr } = await supabase
            .from("course_professor")
            .select("id, course_id, prof_id")
            .in("id", myCpIds);
        if (myCpErr) throw myCpErr;

        for (const r of myCpRows ?? []) {
            myCourseSet.add((r as any).course_id);
            myProfSet.add((r as any).prof_id);
        }
    }

    type CandEnroll = { user_id: string; course_prof_id: number };

    const candEnrolls: CandEnroll[] = [];

    for (const ids of chunk(pos_profile_ids, 25)) {
        const { data: ce, error: ceErr } = await supabase
            .from("enrollments")
            .select("user_id, course_prof_id")
            .in("user_id", ids)
            .eq("term", termId as string); // adding filter to the same term
        if (ceErr) throw ceErr;
        candEnrolls.push(...(ce ?? []));
    }

    const candCpMap = new Map<string, Set<number | string>>();
    for (const r of candEnrolls) {
        const set = candCpMap.get(r.user_id) ?? new Set<number | string>();
        set.add(r.course_prof_id);
        candCpMap.set(r.user_id, set);
    }

    const allCandCpIds = Array.from(new Set(candEnrolls.map((r) => r.course_prof_id)));
    const cpIdToCourse = new Map<number | string, number | string>();
    const cpIdToProf = new Map<number | string, number | string>();

    if (allCandCpIds.length) {
        const { data: cpRows, error: cpErr } = await supabase
            .from("course_professor")
            .select("id, course_id, prof_id")
            .in("id", allCandCpIds);
        if (cpErr) throw cpErr;

        for (const r of cpRows ?? []) {
            const id = (r as any).id as number | string;
            cpIdToCourse.set(id, (r as any).course_id);
            cpIdToProf.set(id, (r as any).prof_id);
        }
    }

    function coursesForCandidate(userId: string): Set<number | string> {
        const out = new Set<number | string>();
        const cps = candCpMap.get(userId) ?? new Set<number | string>();
        for (const CpIds of cps) {
            const cid = cpIdToCourse.get(CpIds);
            if (cid !== undefined) out.add(cid);
        }
        return out;
    }
    function profForCandidate(userId: string): Set<number | string> {
        const out = new Set<number | string>();
        const cps = candCpMap.get(userId) ?? new Set<number | string>();
        for (const myCpIds of cps) {
            const pid = cpIdToProf.get(myCpIds);
            if (pid !== undefined) out.add(pid);
        }
        return out;
    }
    const results: MatchRow[] = [];
    for (const c of candRows as any[]) {
        const theirCourses = coursesForCandidate(c.user_id);
        const theirProfs = profForCandidate(c.user_id);

        // used for counting the amount of overlaps
        let oc = 0;
        for (const x of theirCourses) if (myCourseSet.has(x)) oc++;
        let op = 0;
        for (const x of theirProfs) if (myProfSet.has(x)) op++;

        const score = oc * classWeight + op * profWeight;

        if (oc + op >= minOverlap) {
            results.push({
                user_id: c.user_id,
                display_name: c.display_name as string,
                year: (c.year ?? null) as string | null,
                pp_url: (c.pp_url ?? null) as string | null,
                major: c.major as Major,
                overlap_classes: oc,
                overlap_professors: op,
                score,
            });
        }
    }
    results.sort(
        (a, b) =>
            b.score - a.score ||
            b.overlap_classes - a.overlap_classes ||
            b.overlap_professors - a.overlap_professors ||
            (a.display_name || "").localeCompare(b.display_name || "")
    );
    return results;
}

// left swipping on a user. could use this later to recycle the users after a certain amount of time
export async function passUser(target_User_id: string): Promise<void> {
    const swiper_id = await grabCurr_UserId();
    const { error } = await supabase.from("user_swipes").upsert(
        [
            {
                swiper_id, // current user logged in
                target_id: target_User_id, // who current user swiped on
                direction: "left", // doing a left swipe
            },
        ],
        {
            // makes sure it's one swipe per pair
            onConflict: "swiper_id, target_id",
            ignoreDuplicates: false,
        }
    );
    if (error) throw error;
}
