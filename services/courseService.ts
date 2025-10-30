import { TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/subapase";

export interface Course {
    id: number;
    code: string;
}

export async function getCoursesForSearch(
    searchTerm: string
): Promise<Course[]> {
    const trimmedTerm = searchTerm.trim();

    const { data, error } = await supabase
        .from(TABLES.COURSES)
        .select("id, code")
        .ilike("code", `%${trimmedTerm}%`)
        .order("code", { ascending: true });

    if (error) {
        console.error("Error searching courses:", error);
        return [];
    }

    return data ?? [];
}

export interface ProfessorForCourse {
    course_prof_id: number;
    professor_id: number;
    name: string;
}

export interface CourseProfDisplay {
    course_prof_id: number;
    prof_name: string;
    course_code: string;
}

export async function getProfessorsForCourse(
    courseId: number
): Promise<ProfessorForCourse[]> {
    const { data, error } = await supabase
        .from(TABLES.COURSE_PROFESSOR)
        .select(`id, prof_id, prof:professors (id, name)`)
        .eq("course_id", courseId)
        .order("id", { ascending: true });

    if (error) {
        console.error("getProfessorsForCourse error:", error);
        return [];
    }

    return (data ?? []).map((row: any) => ({
        course_prof_id: row.id,
        professor_id: row.prof.id,
        name: row.prof.name,
    }));
}
