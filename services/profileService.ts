//here we put all the supabase api interactions,
//i think it would be easiest to split them by data model
//(profile, reviews, classes, professors)

import { BUCKETS, FUNCTIONS, TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/supabase";
import { getAllBlockedRelationUserIds, getBlockStatus } from "./blockingService";
import { Major } from "./majorsService";

export interface Profile {
    user_id: string;
    display_name: string;
    major: Major; // adding "| unknown" removes the error on line 46
    year: string | null;
    pp_url: string | null;
    photo_urls: string[] | null;
    bio: string | null;
    is_admin: boolean;
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
        .select("user_id, display_name, major:majors(id, name), year, pp_url, photo_urls, bio, is_admin")
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

    return data as unknown as Profile;
};

export const getProfileByUserId = async (targetUserId: string): Promise<Profile | null> => {
    const blockStatus = await getBlockStatus(targetUserId);

    if (blockStatus.blocked_me) return null;

    const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select("user_id, display_name, major:majors(id, name), year, pp_url, photo_urls, bio")
        .eq("user_id", targetUserId)
        .maybeSingle();

    if (error) {
        console.error("Error fetching target profile:", error);
        return null;
    }

    if (!data) return null;

    return {
        ...data,
        major: Array.isArray(data.major) ? (data.major[0] ?? null) : (data.major ?? null),
    } as Profile;
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
    photoUrls?: string[];
    bio: string | null;
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
            finalUrl = await uploadProfileImage(
                {
                    uri: input.ppUrl,
                    name: "avatar.jpg",
                    type: "image/jpeg",
                },
                "avatar",
            );
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
        photo_urls: input.photoUrls ?? [],
        bio: input.bio,
        ...(finalUrl ? { pp_url: finalUrl } : {}),
    };

    // return a joined row for profile
    const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .upsert(payload, { onConflict: "user_id" })
        .select(
            `user_id, display_name, major:majors!profiles_major_id_fkey(id, name), year, pp_url, photo_urls, bio, is_admin`,
        )
        .single();

    if (error) throw error;

    const major = (data as any).major;

    const result: Profile = {
        user_id: data.user_id,
        display_name: data.display_name,
        year: data.year,
        pp_url: data.pp_url ?? null,
        photo_urls: data.photo_urls ?? null,
        major: { id: major.id, name: major.name },
        bio: data.bio,
        is_admin: !!(data as any).is_admin,
    };

    return result;
}

function getExt(name?: string, mime?: string): string {
    return name?.split(".").pop()?.toLowerCase() || mime?.split("/")[1]?.toLowerCase() || "png";
}

function isLocalUri(uri?: string) {
    return !!uri && (uri.startsWith("file://") || uri.startsWith("content://") || uri.startsWith("blob:"));
}

// adds profile picture into profile_pics public bucket and then gets the pp_url and adds it to the profiles table
export type RNFile = { uri: string; name?: string; type?: string };

export type Attachment = File | Blob | RNFile;

export async function uploadProfileImage(file: Attachment, prefix = "avatar"): Promise<string> {
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
    const filePath = `${userId}/${prefix}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
        .from(BUCKETS.PROFILE_PICS)
        .upload(filePath, body, { upsert: true, contentType: mime });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from(BUCKETS.PROFILE_PICS).getPublicUrl(filePath);

    const publicUrl = publicData.publicUrl;
    if (!publicUrl) throw new Error("Failed to generate public url");
    return publicUrl;
}

export async function uploadMultipleProfilePhotos(uris: string[]): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (const uri of uris) {
        if (!uri) continue;

        if (isLocalUri(uri)) {
            const publicUrl = await uploadProfileImage(
                {
                    uri,
                    name: "extra.jpg",
                    type: "image/jpeg",
                },
                "extra",
            );
            uploadedUrls.push(publicUrl);
        } else {
            uploadedUrls.push(uri);
        }
    }
    return uploadedUrls;
}

type EditProfileInput = {
    display_name?: string; // string or undefined -> not provided
    major?: number | null; // number|null|undefined
    pp_url?: string | null; // if string and local (file://), we upload; if null, we clear; if undefined, ignore
    photo_urls?: string[] | null; // if provided, replaces existing array; if null, clears; if undefined, ignore
    year?: string | null;
    bio?: string | null;
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
    if (updates.bio !== undefined) payload.bio = updates.bio;

    // Handle profile picture:
    // - If undefined: leave unchanged.
    // - If null: clear pp_url.
    // - If string and local (file:// or content://): upload and set public URL.
    // - If string and remote (http/https): set as-is.
    if (updates.pp_url !== undefined) {
        if (updates.pp_url === null) {
            payload.pp_url = null;
        } else if (isLocalUri(updates.pp_url)) {
            const publicUrl = await uploadProfileImage({
                uri: updates.pp_url,
                name: "avatar.jpg",
                type: "image/jpeg",
            });
            payload.pp_url = publicUrl;
        } else {
            payload.pp_url = updates.pp_url; // already a public URL
        }
    }

    if (updates.photo_urls !== undefined) {
        if (updates.photo_urls === null) {
            payload.photo_urls = [];
        } else {
            const uploadedPhotoUrls = await uploadMultipleProfilePhotos(updates.photo_urls);
            payload.photo_urls = uploadedPhotoUrls;
        }
    }

    const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .update(payload)
        .eq("user_id", user.id)
        .select(
            `user_id, display_name, major:majors!profiles_major_id_fkey(id, name), year, pp_url, photo_urls, bio, is_admin`,
        )
        .single();

    if (error) throw error;

    const major = (data as any).major;

    const result: Profile = {
        user_id: data.user_id,
        display_name: data.display_name,
        year: data.year ?? null,
        pp_url: data.pp_url ?? null,
        photo_urls: data.photo_urls ?? null,
        major: { id: major?.id, name: major?.name },
        bio: data.bio ?? null,
        is_admin: !!(data as any).is_admin,
    };

    return result;
}

// matchmaking Alg

// this is used to have users with the highest "score" show first.
export type MatchRow = Profile & {
    same_major: boolean; //checks to see if profiles have same major
    overlapping_classes: number; // checks how many courses the profiles share
    overlapping_professors: number; // checks how many professors the profiles shares
    score: number; // total sum(points) for overlap in proflies. used to arrange the profiles
};

// grabbing profiles with filters (major for now)
export async function getPotentialMatches(
    termId?: number | string,
    opts?: {
        limit?: number;
        offset?: number;
        minimumOverlap?: number;
        left_swipe_cooldown?: number;
        right_swipe_cooldown?: number;
    },
): Promise<MatchRow[]> {
    return majorMatching(termId, {
        limit: opts?.limit,
        offset: opts?.offset,
        minimumOverlap: opts?.minimumOverlap,
        left_swipe_cooldown: opts?.left_swipe_cooldown,
        right_swipe_cooldown: opts?.right_swipe_cooldown,
    });
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
    const blockStatus = await getBlockStatus(user_id);
    if (blockStatus.any_block) return null;

    const { data, error } = await supabase.from("profiles").select("major_id").eq("user_id", user_id).maybeSingle();
    if (error) throw error;
    return data?.major_id ?? null;
}

// excluding and adding a cooldown on passed interacted profiles
async function getExcludedUserIds(
    swiperId: string,
    opts?: {
        // swipped left users would re-appear in the match making after a certain amount of time in hours
        // left swips i have it at after 1 hours for now
        // right swips at forever (can add a condition later if removed friends then activate a 24 hour cooldown
        // before adding back into the poll)
        left_swipe_cooldown?: number;
        right_swipe_cooldown?: number;
    },
): Promise<string[]> {
    // where cooldown timers are set (in hours)
    const left_swipe_cooldown = opts?.left_swipe_cooldown ?? 1;
    const right_swipe_cooldown = opts?.right_swipe_cooldown; // no time so right swiped profiles are hidden forever

    // grabbing current time
    const now = Date.now();

    // determining cooldown time
    const left_cutOff = new Date(now - left_swipe_cooldown * 60 * 60 * 1000).toISOString();

    const { data: leftRows, error: leftErr } = await supabase
        .from("user_swipes")
        .select("target_id")
        .eq("swiper_id", swiperId)
        .eq("direction", "left")
        .gte("created_at", left_cutOff); //creates the cooldown
    if (leftErr) throw leftErr;

    let rightQuery = supabase
        .from("user_swipes")
        .select("target_id")
        .eq("swiper_id", swiperId)
        .eq("direction", "right");

    if (typeof right_swipe_cooldown === "number") {
        const right_cutOff = new Date(now - right_swipe_cooldown * 60 * 60 * 1000).toISOString();
        rightQuery = rightQuery.gte("created_at", right_cutOff);
    }

    const { data: rightRows, error: rightErr } = await rightQuery;
    if (rightErr) throw rightErr;

    //profiles to keep out poll
    const exclude = new Set<string>();
    for (const r of leftRows ?? []) exclude.add((r as any).target_id);
    for (const r of rightRows ?? []) exclude.add((r as any).target_id);

    // removing friends from the pool
    const { data: friendRows, error: friendErr } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .eq("status", "accepted")
        .or(`user_id.eq.${swiperId},friend_id.eq.${swiperId}`);
    if (friendErr) throw friendErr;

    // adding friends to excluded list
    for (const f of friendRows ?? []) {
        const otherId = (f as any).user_id === swiperId ? (f as any).friend_id : (f as any).user_id;
        exclude.add(otherId);
    }

    const blockedIds = await getAllBlockedRelationUserIds();
    for (const id of blockedIds) exclude.add(id);

    return Array.from(exclude);
}

// finding current term based on current date
async function getCurrentTerm(): Promise<{ id: number; name: string }> {
    const todays_date = new Date().toISOString().slice(0, 10); // format year-month,day

    const { data, error } = await supabase
        .from("terms")
        .select("id, name, start_date, end_date")
        .lte("start_date", todays_date)
        .gte("end_date", todays_date)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        throw new Error("No active term found");
    }

    return { id: data.id as number, name: data.name as string };
}

export async function getCurrentTermId(): Promise<number> {
    const { id } = await getCurrentTerm();
    return id;
}

export async function getCurrentTermName(): Promise<string> {
    const { name } = await getCurrentTerm();
    return name;
}

export async function matchMajor(limit = 50): Promise<MatchRow[]> {
    // grabing curren term
    const currentTermId = await getCurrentTermId();

    return majorMatching(currentTermId, {
        limit,
        offset: 0,
        minimumOverlap: 0,
        left_swipe_cooldown: 168, // left swipped users show back up after a week; at 24 hours, users would be swipping
        // on the same users each 24 hours. With a 24-hour cooldown, left-swiped users come back after one day, so users may
        // see the same people again plus new matches.
    });
}

// gets profiles with same major for a specific term
// counts classes and professors both users are taking
// gets a score and uses score to show profiles to current user (greatest score(most overlaping) -> least score(least overlaping) )
// Only does this with current term.
// doesn't show profiles already interacted with using cooldown
export async function majorMatching(
    termId?: number | string,
    opts?: {
        minimumOverlap?: number;
        limit?: number;
        offset?: number;
        left_swipe_cooldown?: number;
        right_swipe_cooldown?: number;
    },
): Promise<MatchRow[]> {
    if (termId == null) {
        termId = await getCurrentTermId();
    }

    const user_id = await grabCurr_UserId();
    const minOverlap = opts?.minimumOverlap ?? 0;
    const limit = opts?.limit ?? 50;
    const offset = opts?.offset ?? 0;

    const termName = await getCurrentTermName();

    const user_major_id = await grabMajorIds(user_id);
    if (user_major_id == null) return [];

    const swipedIds = await getExcludedUserIds(user_id, {
        left_swipe_cooldown: opts?.left_swipe_cooldown,
        right_swipe_cooldown: opts?.right_swipe_cooldown,
    });

    // 1) candidate profiles: same major, exclude self and swiped
    let candidateQuery = supabase
        .from(TABLES.PROFILES)
        .select("user_id, display_name, major:majors(id, name), year, pp_url, photo_urls, bio")
        .eq("major_id", user_major_id)
        .neq("user_id", user_id)
        .range(offset, offset + limit - 1);

    if (swipedIds.length > 0) {
        candidateQuery = candidateQuery.not("user_id", "in", `(${swipedIds.map((x) => `"${x}"`).join(",")})`);
    }

    const { data: candRows, error: candErr } = await candidateQuery;
    if (candErr) throw candErr;
    if (!candRows?.length) return [];

    const pos_profile_ids = candRows.map((p: any) => p.user_id as string);

    // 2) current user's enrollments in the current term
    const { data: myEnrolls, error: myEnrollErr } = await supabase
        .from("enrollments_with_status")
        .select("course_prof_id")
        .eq("user_id", user_id)
        .eq("term", termName)
        .eq("status", "current");
    if (myEnrollErr) throw myEnrollErr;

    const myCpIds = (myEnrolls ?? []).map((r: any) => r.course_prof_id as number);

    // 3) current user's course and professor sets
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
            .from("enrollments_with_status")
            .select("user_id, course_prof_id")
            .in("user_id", ids)
            .eq("term", termName)
            .eq("status", "current");
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
        for (const cpId of cps) {
            const cid = cpIdToCourse.get(cpId);
            if (cid !== undefined) out.add(cid);
        }
        return out;
    }

    function profForCandidate(userId: string): Set<number | string> {
        const out = new Set<number | string>();
        const cps = candCpMap.get(userId) ?? new Set<number | string>();
        for (const cpId of cps) {
            const pid = cpIdToProf.get(cpId);
            if (pid !== undefined) out.add(pid);
        }
        return out;
    }

    const results: MatchRow[] = [];
    for (const c of candRows as any[]) {
        const theirCourses = coursesForCandidate(c.user_id);
        const theirProfs = profForCandidate(c.user_id);

        let oc = 0;
        for (const x of theirCourses) if (myCourseSet.has(x)) oc++;
        let op = 0;
        for (const x of theirProfs) if (myProfSet.has(x)) op++;

        const userMajorId = Number((c.major as any)?.id);
        const ifSame_major = !Number.isNaN(userMajorId) && userMajorId === user_major_id;
        const overlapping_major = ifSame_major ? 1 : 0;

        const score = overlapping_major + oc + op;

        if (score >= minOverlap) {
            results.push({
                user_id: c.user_id,
                display_name: c.display_name as string,
                year: (c.year ?? null) as string | null,
                pp_url: (c.pp_url ?? null) as string | null,
                photo_urls: (c.photo_urls ?? null) as string[] | null,
                bio: (c.bio ?? null) as string | null,
                major: c.major as Major,
                is_admin: !!c.is_admin,
                same_major: ifSame_major,
                overlapping_classes: oc,
                overlapping_professors: op,
                score,
            });
        }
    }

    results.sort((a, b) => {
        const aMajor = a.same_major ? 1 : 0;
        const bMajor = b.same_major ? 1 : 0;

        return (
            bMajor - aMajor ||
            b.score - a.score ||
            b.overlapping_classes - a.overlapping_classes ||
            b.overlapping_professors - a.overlapping_professors ||
            (a.display_name || "").localeCompare(b.display_name || "")
        );
    });

    return results;
}

export interface ProfileForSearch {
    user_id: string;
    display_name: string;
    pp_url?: string;
    photo_urls?: string[];
    major: string;
    year: string;
    bio?: string;
}

export const searchForProfile = async (searchTerm: string): Promise<ProfileForSearch[]> => {
    const { data, error } = await supabase.rpc("get_profile_from_search", { p_search_term: searchTerm });

    if (error) {
        console.error("searchForProfile: ", error);
        return [];
    }

    return data;
};

export interface ProfileWithMutuals extends ProfileForSearch {
    mutual_count: number;
    mutual_friends: { friend_id: string; display_name: string }[];
}

export const searchForProfileWithMutuals = async (searchTerm: string): Promise<ProfileWithMutuals[]> => {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
        console.error("searchForProfileWithMutuals auth error:", authError);
        return [];
    }

    const { data, error } = await supabase.rpc(FUNCTIONS.SEARCH_PROFILES_WITH_MUTUALS, {
        p_search_term: searchTerm,
        p_user_id: user.id,
    });

    console.log("DATA: ", data);

    if (error) {
        console.error("searchForProfileWithMutuals:", error);
        return [];
    }

    return (data ?? []).map((row: any) => ({
        user_id: row.user_id,
        display_name: row.display_name,
        major: row.major,
        year: row.year,
        pp_url: row.pp_url,
        mutual_count: row.mutual_count,
        mutual_friends: row.mutual_friends ?? [],
        bio: row.bio,
        photo_urls: row.photo_urls ?? [],
    }));
};

// ── Recent user searches ──

export interface RecentUserSearch {
    id: number;
    user_id: string;
    other_user_id: string;
    created_at: string;
    viewed_at: string;
    viewed_count: number;
    cleared: boolean;
}

export type RecentSearchWithProfile = RecentUserSearch & {
    profile: ProfileForSearch;
};

/** Get the last 20 non-cleared recent searches for the current user, with profile info. */
export async function getRecentSearches(): Promise<RecentSearchWithProfile[]> {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) return [];

    const { data, error } = await supabase
        .from(TABLES.RECENT_USER_SEARCH)
        .select("*")
        .eq("user_id", user.id)
        .eq("cleared", false)
        .order("viewed_at", { ascending: false })
        .limit(20);

    if (error) {
        console.error("getRecentSearches:", error);
        return [];
    }
    if (!data || data.length === 0) return [];

    const otherIds = data.map((r: any) => r.other_user_id);

    const { data: profiles, error: profErr } = await supabase
        .from(TABLES.PROFILES)
        .select("user_id, display_name, major:majors(id, name), year, pp_url")
        .in("user_id", otherIds);

    if (profErr) {
        console.error("getRecentSearches profiles:", profErr);
        return [];
    }

    const profileMap = new Map<string, ProfileForSearch>();
    for (const p of profiles ?? []) {
        const maj = (p as any).major;
        profileMap.set(p.user_id, {
            user_id: p.user_id,
            display_name: p.display_name,
            pp_url: p.pp_url ?? undefined,
            major: maj?.name ?? "",
            year: p.year ?? "",
        });
    }

    return data
        .filter((r: any) => profileMap.has(r.other_user_id))
        .map((r: any) => ({
            ...r,
            profile: profileMap.get(r.other_user_id)!,
        }));
}

export async function upsertRecentSearch(otherUserId: string): Promise<void> {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) return;

    // Check if a row already exists
    const { data: existing, error: fetchErr } = await supabase
        .from(TABLES.RECENT_USER_SEARCH)
        .select("id, viewed_count")
        .eq("user_id", user.id)
        .eq("other_user_id", otherUserId)
        .maybeSingle();

    if (fetchErr) {
        console.error("upsertRecentSearch fetch:", fetchErr);
        return;
    }

    if (existing) {
        const { error } = await supabase
            .from(TABLES.RECENT_USER_SEARCH)
            .update({
                viewed_at: new Date().toISOString(),
                viewed_count: (existing.viewed_count ?? 0) + 1,
                cleared: false,
            })
            .eq("id", existing.id);
        if (error) console.error("upsertRecentSearch update:", error);
    } else {
        const { error } = await supabase.from(TABLES.RECENT_USER_SEARCH).insert({
            user_id: user.id,
            other_user_id: otherUserId,
            viewed_at: new Date().toISOString(),
            viewed_count: 1,
            cleared: false,
        });
        if (error) console.error("upsertRecentSearch insert:", error);
    }
}

// Mark a search as cleared off
export async function clearRecentSearch(recentSearchId: number): Promise<void> {
    const { error } = await supabase.from(TABLES.RECENT_USER_SEARCH).update({ cleared: true }).eq("id", recentSearchId);

    if (error) console.error("clearRecentSearch:", error);
}

export type BlockedUser = Profile;

export async function getBlockedUsers(): Promise<BlockedUser[]> {
    const blockerId = await grabCurr_UserId();

    const { data: blockRows, error: blockErr } = await supabase
        .from("user_blocks")
        .select("blocked_id")
        .eq("blocker_id", blockerId)
        .order("created_at", { ascending: false });

    if (blockErr) throw blockErr;

    const blockedIds = (blockRows ?? []).map((row: any) => row.blocked_id);

    if (blockedIds.length === 0) return [];

    const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select("user_id, display_name, major:majors(id, name), year, pp_url, photo_urls, bio")
        .in("user_id", blockedIds);

    if (error) throw error;

    return (data ?? []).map((profile: any) => ({
        ...profile,
        major: Array.isArray(profile.major) ? (profile.major[0] ?? null) : (profile.major ?? null),
    })) as BlockedUser[];
}

export async function unblockUser(blockedId: string): Promise<void> {
    const blockerId = await grabCurr_UserId();

    const { error } = await supabase
        .from("user_blocks")
        .delete()
        .eq("blocker_id", blockerId)
        .eq("blocked_id", blockedId);

    if (error) throw error;
}
