import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
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
        },
    });
    if (error) throw error;

    // Open the flow and tell WebBrowser what URL to expect on return
    const res = await WebBrowser.openAuthSessionAsync(data.url!, redirectTo);
    console.log("Res from google.ts:", res);

    const { data: sess } = await supabase.auth.getSession();
    return sess.session;
}
