import { Database } from "@/lib/database.types";
import { TABLES } from "@/lib/enumBackend";
import supabase from "@/lib/subapase";
import { CourseProfDisplay } from "./courseService";
import { getCurrentAndNextTerm } from "./termsService";

type EnrollmentInsert = Database["public"]["Tables"]["enrollments"]["Insert"];

export interface Enrollment {
    id: number;
    user_id: string;
    term: string;
    course_prof: {
        course: {
            id: number;
            code: string;
        };
        prof: {
            id: number;
            name: string;
        };
    };
}

export async function getEnrollmentsForProfile(): Promise<CourseProfDisplay[] | null> {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
        console.error("No user id found");
        return null;
    }
    const { data, error } = await supabase
        .from("enrollments")
        .select(`id, term, course_professor:course_prof_id (id, course:courses (code), professor:professors (name))`)
        .eq("user_id", user.id);

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

export async function getCurrentandNextCoursesForProfile(): Promise<CourseProfDisplay[] | null> {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
        console.warn("No user in session");
        return null;
    }

    const { data, error } = await supabase
        .from("enrollments")
        .select(`id, term, course_professor:course_prof_id (id, course:courses (code), professor:professors (name))`)
        .eq("user_id", user.id);

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

export async function createEnrollments(courseProfIds: number[], termName: string) {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
        console.warn("No user in session");
        return null;
    }
    if (courseProfIds.length === 0) return;
    const { data, error } = await supabase
        .from(TABLES.ENROLLMENTS)
        .insert(
            courseProfIds.map(
                (courseProfId): EnrollmentInsert => ({
                    user_id: user.id,
                    course_prof_id: courseProfId,
                    term: termName,
                })
            )
        )
        .select(); // optional: returns the inserted rows

    if (error) {
        console.error("Error inserting enrollments:", error);
        throw error;
    }

    return data;
}

export async function deleteEnrollments(enrollmentIds: number[]) {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
        console.warn("No user in session");
        return null;
    }
    console.log("DELETING", enrollmentIds);
    if (enrollmentIds.length === 0) return;
    const { data, error } = await supabase
        .from(TABLES.ENROLLMENTS)
        .delete()
        .in("id", enrollmentIds)
        .eq("user_id", user.id);

    if (error) {
        console.error("Error deleting enrollments:", error);
        throw error;
    }

    return data;
}

export interface ReviewableEnrollment {
    enrollmentId: number;
    term: string;
    course_prof_id: number;
    prof: { name: string; id: number };
    course: { code: string; id: number };
}

export async function getReviewableEnrollments(): Promise<ReviewableEnrollment[]> {
    // you can only review past enrollments you haven't reviewed yet
    const user = await supabase.auth.getUser();
    const term = await getCurrentAndNextTerm();

    if (!term) {
        console.error("No term found");
        return [];
    }

    const currTerm = term[0].name;
    const nextTerm = term[1].name;

    if (!user?.data.user?.id) {
        console.error("No user id found");
        return [];
    }

    const { data, error } = await supabase
        .from(TABLES.ENROLLMENTS)
        .select(
            `id, term, review_written, course_prof:course_prof_id (id, professor:prof_id (id, name), course:course_id (id, code))`
        )
        .eq("user_id", user.data.user.id)
        .eq("review_written", false)
        // .neq("term", currTerm)
        .neq("term", nextTerm);

    if (error) {
        console.error("Error getting reviewable enrollments:", error);
        throw error;
    }

    console.log("Raw enrollments from Supabase:", data);

    // Normalize into your ReviewableEnrollment[]
    const normalizedData: ReviewableEnrollment[] = ((data as any[]) ?? []) //made it any to silence ts, since supabase joins return weird data; it works so we good
        .filter((row) => row.course_prof && row.course_prof.professor && row.course_prof.course)
        .map((row) => {
            const cp = row.course_prof!;
            const prof = cp.professor!;
            const course = cp.course!;

            return {
                enrollmentId: row.id,
                term: row.term,
                course_prof_id: cp.id,
                prof: {
                    id: prof.id,
                    name: prof.name,
                },
                course: {
                    id: course.id,
                    code: course.code,
                },
            };
        });

    console.log("Reviewable enrollments (normalized):", normalizedData);
    return normalizedData;
}

export async function markEnrollmentAsReviewed(enrollmentId: number) {
    const { data, error } = await supabase
        .from(TABLES.ENROLLMENTS)
        .update({ review_written: true })
        .eq("id", enrollmentId)
        .select()
        .single();

    if (error) {
        console.error("Error updating enrollment", error);
        return null;
    }

    return data;
}
