import { TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/subapase";

export async function createEnrollments(
    userId: string,
    courseProfIds: number[]
) {
    const { data, error } = await supabase
        .from(TABLES.ENROLLMENTS)
        .insert(
            courseProfIds.map((courseProfId) => ({
                user_id: userId,
                course_prof_id: courseProfId,
            }))
        )
        .select(); // optional: returns the inserted rows

    if (error) {
        console.error("Error inserting enrollments:", error);
        throw error;
    }

    return data;
}
