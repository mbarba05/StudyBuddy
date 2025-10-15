import supabase from "@/lib/subapase";
import * as QueryParams from "expo-auth-session/build/QueryParams";

export async function createSessionFromUrl(url: string) {
    const { params, errorCode } = QueryParams.getQueryParams(url);
    if (errorCode) throw new Error(errorCode);

    const access_token = params?.access_token as string;
    const refresh_token = params?.refresh_token as string;

    if (!access_token) return null;

    const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
    });
    if (error) throw error;

    return data.session ?? null;
}
