import { useAuth } from "@/services/auth/AuthProvider";
import { getUserProfile } from "@/services/profileService";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type ProfileCtx = {
    profileReady: boolean; //true when we've tried fetching (or user is null)
    hasProfile: boolean | null; //null = unknown; true/false once ready
    isAdmin: boolean;
    refreshProfile: () => Promise<void>;
};

const Ctx = createContext<ProfileCtx>({
    profileReady: false,
    hasProfile: null,
    isAdmin: false,
    refreshProfile: async () => {},
});

export const ProfileProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { user, authReady } = useAuth();
    const [profileReady, setProfileReady] = useState(false);
    const [hasProfile, setHasProfile] = useState<boolean | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    const fetchOnce = useCallback(async (_uid: string) => {
        try {
            const profile = await getUserProfile();
            setHasProfile(!!profile);
            setIsAdmin(!!profile?.is_admin);
        } catch (error) {
            console.error("[ProfileProvider] fetch error:", error);
            setHasProfile(false);
            setIsAdmin(false);
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        if (!user) {
            setHasProfile(null);
            setIsAdmin(false);
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
            if (!authReady) return; //don't start until auth decided
            if (!user) {
                if (!mounted) return;
                setHasProfile(null);
                setIsAdmin(false);
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

    return <Ctx.Provider value={{ profileReady, hasProfile, isAdmin, refreshProfile }}>{children}</Ctx.Provider>;
};

export const useProfileGate = () => useContext(Ctx);
