import { TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/subapase";

export interface Term {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
}

export async function getPast4YearTerms(): Promise<Term[] | null> {
    const today = new Date();
    const fourYearsAgo = new Date(today.getFullYear() - 4, today.getMonth(), today.getDate());

    const { data, error } = await supabase
        .from(TABLES.TERMS)
        .select("*")
        .lt("end_date", today.toISOString().split("T")[0]) //before today
        .gte("end_date", fourYearsAgo.toISOString().split("T")[0]) //within last 4 years
        .order("end_date", { ascending: false });

    if (error) {
        console.error("Error fetching terms:", error);
        return null;
    }

    return data ?? [];
}

export async function getCurrentAndNextTerm(): Promise<[Term, Term] | null> {
    //Get all terms
    const { data, error } = await supabase.from(TABLES.TERMS).select("*").order("id", { ascending: true });

    if (error) {
        console.error("Error fetching terms:", error);
        return null;
    }

    const terms = data ?? [];

    const today = new Date();

    //Find the current term based on today's date
    const current = terms.find((t) => new Date(t.start_date) <= today && today <= new Date(t.end_date)) ?? null;

    //Find the next term by adding one to current terms id
    const next = current ? (terms.find((t) => t.id === current.id + 1) ?? null) : null;

    return [current, next];
}
