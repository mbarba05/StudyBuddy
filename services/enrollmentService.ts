import { TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/subapase";
import { CourseProfDisplay } from "./courseService";
import { getCurrentTermName } from "./profileService";


export interface Enrollment {
    id: number;
    course_prod_id: number;
}

export async function getCoursesForProfile(userId: string | null): Promise<CourseProfDisplay[] | null> {
    if (!userId) {
        console.error("No user id found");
        return null;
    }
    const { data, error } = await supabase
        .from("enrollments")
        .select(`id, course_professor:course_prof_id (id, course:courses (code), professor:professors (name))`)
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
    }));
}

export async function createEnrollmentsT(userId: string, courseProfIds: number[]) {
    ///TODO: term support for everything here
    if (courseProfIds.length === 0) return;
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

// editing createEnrollments so it writes info to both tables(enrollments and enrollments_with_status)
export async function createEnrollments(userId: string, courseProfIds: number[]) {
    // exit if there's no courses
    if (courseProfIds. length === 0) return;

    // grabing active term name defined as "current" 
    const termName = await getCurrentTermName();
    const status = "current";

    //filling the rows of the tables
    const baseRow = courseProfIds.map((courseProfId) => ({
        user_id: userId,
        course_prof_id: courseProfId,
        term: termName,
        //status,
    }));

    // adding to table enrollment
    const { data, error } = await supabase
        .from(TABLES.ENROLLMENTS)
        .insert(baseRow)
        .select(); 

    if(error){
        console.error("Inserting enrollments failed: ", error);
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
