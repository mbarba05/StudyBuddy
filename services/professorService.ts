import { TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/subapase";

export interface ProfessorForSearch {
    id: number;
    name: string;
    reviewCount?: number | null;
}

export async function getProfessorsForSearch(searchTerm: string): Promise<ProfessorForSearch[]> {
    const trimmedTerm = searchTerm.trim();
    if (!searchTerm) return [];
    const { data, error } = await supabase
        .from(TABLES.PROFESSORS)
        .select("id, name")
        .ilike("name", `%${trimmedTerm}%`)
        .order("name", { ascending: true });

    if (error) {
        console.error("Error searching professors:", error);
        return [];
    }

    const profsWithRevCount: ProfessorForSearch[] = [];

    for (const prof of data) {
        let { data, error } = await supabase.rpc("get_professor_total_reviews", { professor_id: prof.id });
        if (error) data = 0;
        profsWithRevCount.push({ name: prof.name, id: prof.id, reviewCount: data });
    }

    return profsWithRevCount ?? [];
}

export async function createCourseProf(prof_id: number, course_id: number): Promise<number | null> {
    const { data, error } = await supabase
        .from(TABLES.COURSE_PROFESSOR)
        .insert({ prof_id, course_id })
        .select("id")
        .single();

    if (error) {
        console.error("Error creating course_prof", error);
        return null;
    }

    const id = typeof data?.id === "number" ? data.id : null;
    return id;
}

export async function createProfessor(name: string): Promise<number | null> {
    const { data, error } = await supabase.from(TABLES.PROFESSORS).insert({ name }).select("id").single();

    if (error) {
        console.error("Error creating professor");
        return null;
    }

    const id = typeof data?.id === "number" ? data.id : null;
    return id;
}
