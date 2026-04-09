import { TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/subapase";

export interface ProfessorForSearch {
    id: number;
    name: string;
    reviewcount?: number | null;
}

export async function getProfessorsForSearch(searchTerm: string): Promise<ProfessorForSearch[]> {
    const trimmedTerm = searchTerm.trim();
    if (!trimmedTerm) return [];
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

    for (const prof of data ?? []) {
        let { data, error } = await supabase.rpc("get_professor_total_reviews", { professor_id: prof.id });
        if (error) data = 0;
        profsWithRevCount.push({ name: prof.name, id: prof.id, reviewcount: data });
    }

    return profsWithRevCount ?? [];
}

export async function createCourseProf(prof_id: number, course_id: number): Promise<number | null> {
    const { data, error } = await supabase
        .from(TABLES.COURSE_PROFESSOR)
        .upsert({ prof_id, course_id }, { onConflict: "prof_id,course_id" }) // prevents dups
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
    const trimmedName = name.trim(); // makes sure all the white spaces are removed from the front and end of the name. prevents from creating dups with added white space
    if (!trimmedName) return null;
    const { data, error } = await supabase.from(TABLES.PROFESSORS).insert({ name: trimmedName }).select("id").single();

    if (error) {
        console.error("Error creating professor");
        return null;
    }

    //const id = typeof data?.id === "number" ? data.id : null;
    //return id;
    return typeof data?.id === "number" ? data.id : null;
}

export async function linkProfToMajor(profId: number, majorId: number): Promise<boolean> {
    const { error } = await supabase.from("professor_majors").upsert(
        {
            professor_id: profId,
            major_id: majorId,
        },
        {
            onConflict: "professor_id,major_id",
        },
    );
    if (error) {
        console.error("Error: Cannot link professor to major: ", error);
        return false;
    }
    return true;
}
