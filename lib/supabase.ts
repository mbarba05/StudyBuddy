import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const { SUPABASE_URL, SUPABASE_SECRET, SUPABASE_PUBLISHABLE_KEY } = Constants.expoConfig?.extra as {
    SUPABASE_URL: string;
    SUPABASE_SECRET: string;
    SUPABASE_PUBLISHABLE_KEY: string;
};

console.log("SUPABASE_URL:", SUPABASE_URL);
console.log("SUPABASE_PUBLISHABLE_KEY:", SUPABASE_PUBLISHABLE_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

export default supabase;
