import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const { SUPABASE_URL, SUPABASE_SECRET } = Constants.expoConfig?.extra as {
    SUPABASE_URL: string;
    SUPABASE_SECRET: string;
};
console.log("PROCESS", process.env);
console.log("Supabase URL:", SUPABASE_URL);
console.log("Supabase ANON KEY:", SUPABASE_SECRET);

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

export default supabase;
