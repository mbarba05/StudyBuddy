import { useAuth } from "@/services/auth/AuthProvider";
import { hasProfile } from "@/services/profileService";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

type OnboardingCtx = {
    ready: boolean;
    needsOnboarding: boolean | null;
    refresh: () => Promise<void>;
    setNeedsOnboarding: (v: boolean) => void;
};

const Ctx = createContext<OnboardingCtx>({
    ready: false,
    needsOnboarding: null,
    refresh: async () => {},
    setNeedsOnboarding: () => {},
});

export const OnboardingProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { user } = useAuth();
    const [ready, setReady] = useState(false);
    const [needsOnboarding, setNeedsOnboardingState] = useState<boolean | null>(
        null
    );

    const refresh = useCallback(async () => {
        if (!user) {
            setNeedsOnboardingState(null);
            setReady(true);
            return;
        }
        const exists = await hasProfile(user.id);
        setNeedsOnboardingState(!exists);
        setReady(true);
    }, [user]);

    useEffect(() => {
        //when user changes, run a fresh check
        setReady(false);
        setNeedsOnboardingState(null);
        refresh();
    }, [user, refresh]);

    const value: OnboardingCtx = {
        ready,
        needsOnboarding,
        refresh,
        setNeedsOnboarding: (v) => setNeedsOnboardingState(v),
    };

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useOnboarding = () => useContext(Ctx);
