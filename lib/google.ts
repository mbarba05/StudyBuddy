import { VALID_EMAIL_DOMAIN } from "@/services/auth/authModels";
import { createSessionFromUrl } from "@/services/auth/authRedirect";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Alert } from "react-native";
import supabase from "./subapase";

WebBrowser.maybeCompleteAuthSession();

//signing in only will work on a dev build, i still need to set that up
//use this on a button to sign in with google

export async function signInWithGoogle() {
    const redirectTo = makeRedirectUri();
    console.log(redirectTo);
    // Ask Supabase for the auth URL but prevent it from auto-opening
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo,
            skipBrowserRedirect: true,
            queryParams: { hd: VALID_EMAIL_DOMAIN, prompt: "select_account" }, //only show fresno state emails
        },
    });
    if (error) throw error;

    // Open the flow and tell WebBrowser what URL to expect on return
    const res = await WebBrowser.openAuthSessionAsync(data.url!, redirectTo);
    console.log("Res from google.ts:", res);

    if (res.type === "success" && res.url) {
        const session = await createSessionFromUrl(res.url);
        const email = session?.user?.email ?? "";

        const allowed = email.endsWith("@mail.fresnostate.edu");

        if (!allowed) {
            await supabase.auth.signOut();
            Alert.alert(
                "Use your Fresno State email",
                "Please sign in with your campus account."
            );
            return null;
        }

        return session;
    }

    return null;
}
