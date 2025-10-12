import supabase from "@/lib/subapase";
import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import "./global.css";
//this will be an error we can ignore but we still need this line
// something about native apps not seeing css files if you find the error annoying and want to fix
import Home from "./screens/Home";
import Login from "./screens/Login";

export default function Index() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: listener } = supabase.auth.onAuthStateChange(
            (_event, session) => setSession(session)
        );

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    if (loading) return null; // or a splash screen

    return session ? <Home /> : <Login />;
}
