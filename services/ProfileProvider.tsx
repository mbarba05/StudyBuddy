import supabase from "@/lib/subapase";
import { useAuth } from "@/services/auth/AuthProvider";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type ProfileCtx = {
    profileReady: boolean; //true when we’ve tried fetching (or user is null)
    hasProfile: boolean | null; //null = unknown; true/false once ready
    refreshProfile: () => Promise<void>;
};

const Ctx = createContext<ProfileCtx>({
    profileReady: false,
    hasProfile: null,
    refreshProfile: async () => {},
});

export const ProfileProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { user, authReady } = useAuth();
    const [profileReady, setProfileReady] = useState(false);
    const [hasProfile, setHasProfile] = useState<boolean | null>(null);

    const fetchOnce = useCallback(async (uid: string) => {
        const { data, error } = await supabase.from("profiles").select("user_id").eq("user_id", uid).single();

        //“No rows found” isn’t a fatal error — treat as no profile
        if (error && error.code !== "PGRST116") {
            console.error("[ProfileProvider] fetch error:", error);
        }
        setHasProfile(!!data);
    }, []);

    const refreshProfile = useCallback(async () => {
        if (!user) {
            setHasProfile(null);
            setProfileReady(true);
            return;
        }
        setProfileReady(false);
        await fetchOnce(user.id);
        setProfileReady(true);
    }, [user, fetchOnce]);

    useEffect(() => {
        let mounted = true;
        //Re-evaluate whenever auth changes
        (async () => {
            if (!authReady) return; //don’t start until auth decided
            if (!user) {
                if (!mounted) return;
                setHasProfile(null);
                setProfileReady(true);
                return;
            }
            if (!mounted) return;
            setProfileReady(false);
            await fetchOnce(user.id);
            if (!mounted) return;
            setProfileReady(true);
        })();

        return () => {
            mounted = false;
        };
    }, [user, authReady, fetchOnce]);

    return <Ctx.Provider value={{ profileReady, hasProfile, refreshProfile }}>{children}</Ctx.Provider>;
};

export const useProfileGate = () => useContext(Ctx);
