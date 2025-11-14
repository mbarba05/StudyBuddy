import { TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/subapase";
import { CourseProfDisplay } from "./courseService";

export interface Enrollment {
    id: number;
    course_prod_id: number;
}

export async function getEnrollmentsForProfile(userId: string | null): Promise<CourseProfDisplay[] | null> {
    if (!userId) {
        console.error("No user id found");
        return null;
    }
    const { data, error } = await supabase
        .from("enrollments")
        .select(`id, term, course_professor:course_prof_id (id, course:courses (code), professor:professors (name))`)
        .eq("user_id", userId);

    if (error) {
        console.error("Error fetching enrollments:", error);
        throw error;
    }
    if (!data) return [];

    return data.map((row: any) => ({
        enrollmentId: row.id,
        course_prof_id: row.course_professor.id,
        course_code: row.course_professor.course.code,
        prof_name: row.course_professor.professor.name,
        term: row.term,
    }));
}

export async function getCurrentandNextCoursesForProfile(userId: string | null): Promise<CourseProfDisplay[] | null> {
    if (!userId) {
        console.error("No user id found");
        return null;
    }
    const { data, error } = await supabase
        .from("enrollments")
        .select(`id, term, course_professor:course_prof_id (id, course:courses (code), professor:professors (name))`)
        .eq("user_id", userId);

    if (error) {
        console.error("Error fetching enrollments:", error);
        throw error;
    }
    if (!data) return [];

    return data.map((row: any) => ({
        enrollmentId: row.id,
        course_prof_id: row.course_professor.id,
        course_code: row.course_professor.course.code,
        prof_name: row.course_professor.professor.name,
        term: row.term,
    }));
}

export async function createEnrollments(userId: string, courseProfIds: number[], termName: string) {
    if (courseProfIds.length === 0) return;
    const { data, error } = await supabase
        .from(TABLES.ENROLLMENTS)
        .insert(
            courseProfIds.map((courseProfId) => ({
                user_id: userId,
                course_prof_id: courseProfId,
                term: termName,
            }))
        )
        .select(); // optional: returns the inserted rows

    if (error) {
        console.error("Error inserting enrollments:", error);
        throw error;
    }

    return data;
}

export async function deleteEnrollments(userId: string, enrollmentIds: number[]) {
    console.log("DELETING", enrollmentIds);
    if (enrollmentIds.length === 0) return;
    const { data, error } = await supabase
        .from(TABLES.ENROLLMENTS)
        .delete()
        .in("id", enrollmentIds)
        .eq("user_id", userId);

    if (error) {
        console.error("Error deleting enrollments:", error);
        throw error;
    }

    return data;
}
