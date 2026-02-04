export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "13.0.5";
    };
    public: {
        Tables: {
            course_professor: {
                Row: {
                    course_id: number;
                    created_at: string;
                    id: number;
                    prof_id: number;
                };
                Insert: {
                    course_id: number;
                    created_at?: string;
                    id?: number;
                    prof_id: number;
                };
                Update: {
                    course_id?: number;
                    created_at?: string;
                    id?: number;
                    prof_id?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: "course_professor_course_id_fkey";
                        columns: ["course_id"];
                        isOneToOne: false;
                        referencedRelation: "courses";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "course_professor_prof_id_fkey";
                        columns: ["prof_id"];
                        isOneToOne: false;
                        referencedRelation: "professors";
                        referencedColumns: ["id"];
                    },
                ];
            };
            courses: {
                Row: {
                    code: string;
                    created_at: string;
                    id: number;
                };
                Insert: {
                    code: string;
                    created_at?: string;
                    id?: number;
                };
                Update: {
                    code?: string;
                    created_at?: string;
                    id?: number;
                };
                Relationships: [];
            };
            enrollments: {
                Row: {
                    course_prof_id: number;
                    created_at: string;
                    id: number;
                    review_written: boolean;
                    term: string | null;
                    user_id: string;
                };
                Insert: {
                    course_prof_id: number;
                    created_at?: string;
                    id?: number;
                    review_written?: boolean;
                    term?: string | null;
                    user_id: string;
                };
                Update: {
                    course_prof_id?: number;
                    created_at?: string;
                    id?: number;
                    review_written?: boolean;
                    term?: string | null;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "enrollments_course_prof_id_fkey";
                        columns: ["course_prof_id"];
                        isOneToOne: false;
                        referencedRelation: "course_professor";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "enrollments_student_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["user_id"];
                    },
                    {
                        foreignKeyName: "enrollments_term_fkey";
                        columns: ["term"];
                        isOneToOne: false;
                        referencedRelation: "terms";
                        referencedColumns: ["name"];
                    },
                ];
            };
            friend_requests: {
                Row: {
                    created_at: string;
                    id: number;
                    receiver_id: string | null;
                    sender_id: string | null;
                    status: Database["public"]["Enums"]["friend_status"];
                };
                Insert: {
                    created_at?: string;
                    id?: number;
                    receiver_id?: string | null;
                    sender_id?: string | null;
                    status?: Database["public"]["Enums"]["friend_status"];
                };
                Update: {
                    created_at?: string;
                    id?: number;
                    receiver_id?: string | null;
                    sender_id?: string | null;
                    status?: Database["public"]["Enums"]["friend_status"];
                };
                Relationships: [
                    {
                        foreignKeyName: "friend_requests_receiver_id_fkey";
                        columns: ["receiver_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["user_id"];
                    },
                    {
                        foreignKeyName: "friend_requests_sender_id_fkey";
                        columns: ["sender_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["user_id"];
                    },
                ];
            };
            friendships: {
                Row: {
                    created_at: string;
                    friend_id: string;
                    id: number;
                    status: Database["public"]["Enums"]["friend_status"];
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    friend_id: string;
                    id?: number;
                    status?: Database["public"]["Enums"]["friend_status"];
                    user_id?: string;
                };
                Update: {
                    created_at?: string;
                    friend_id?: string;
                    id?: number;
                    status?: Database["public"]["Enums"]["friend_status"];
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "friendships_friend_id_fkey";
                        columns: ["friend_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["user_id"];
                    },
                    {
                        foreignKeyName: "friendships_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["user_id"];
                    },
                ];
            };
            majors: {
                Row: {
                    created_at: string;
                    id: number;
                    name: string;
                };
                Insert: {
                    created_at?: string;
                    id?: number;
                    name: string;
                };
                Update: {
                    created_at?: string;
                    id?: number;
                    name?: string;
                };
                Relationships: [];
            };
            professors: {
                Row: {
                    created_at: string;
                    id: number;
                    name: string;
                    rating_average: number | null;
                    total_reviews: number | null;
                };
                Insert: {
                    created_at?: string;
                    id?: number;
                    name: string;
                    rating_average?: number | null;
                    total_reviews?: number | null;
                };
                Update: {
                    created_at?: string;
                    id?: number;
                    name?: string;
                    rating_average?: number | null;
                    total_reviews?: number | null;
                };
                Relationships: [];
            };
            profiles: {
                Row: {
                    created_at: string;
                    display_name: string;
                    major_id: number;
                    pp_url: string | null;
                    user_id: string;
                    year: Database["public"]["Enums"]["grade_level"];
                };
                Insert: {
                    created_at?: string;
                    display_name: string;
                    major_id: number;
                    pp_url?: string | null;
                    user_id: string;
                    year: Database["public"]["Enums"]["grade_level"];
                };
                Update: {
                    created_at?: string;
                    display_name?: string;
                    major_id?: number;
                    pp_url?: string | null;
                    user_id?: string;
                    year?: Database["public"]["Enums"]["grade_level"];
                };
                Relationships: [
                    {
                        foreignKeyName: "profiles_major_id_fkey";
                        columns: ["major_id"];
                        isOneToOne: false;
                        referencedRelation: "majors";
                        referencedColumns: ["id"];
                    },
                ];
            };
            reviews: {
                Row: {
                    course_diff: number;
                    created_at: string;
                    enrollment_id: number;
                    grade: Database["public"]["Enums"]["grade"];
                    id: number;
                    likes: number;
                    prof_rating: number;
                    review: string;
                };
                Insert: {
                    course_diff: number;
                    created_at?: string;
                    enrollment_id: number;
                    grade?: Database["public"]["Enums"]["grade"];
                    id?: number;
                    likes?: number;
                    prof_rating: number;
                    review: string;
                };
                Update: {
                    course_diff?: number;
                    created_at?: string;
                    enrollment_id?: number;
                    grade?: Database["public"]["Enums"]["grade"];
                    id?: number;
                    likes?: number;
                    prof_rating?: number;
                    review?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "reviews_enrollment_id_fkey";
                        columns: ["enrollment_id"];
                        isOneToOne: true;
                        referencedRelation: "enrollments";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "reviews_enrollment_id_fkey";
                        columns: ["enrollment_id"];
                        isOneToOne: true;
                        referencedRelation: "enrollments_with_status";
                        referencedColumns: ["id"];
                    },
                ];
            };
            terms: {
                Row: {
                    end_date: string;
                    id: number;
                    name: string;
                    start_date: string;
                };
                Insert: {
                    end_date: string;
                    id?: number;
                    name: string;
                    start_date: string;
                };
                Update: {
                    end_date?: string;
                    id?: number;
                    name?: string;
                    start_date?: string;
                };
                Relationships: [];
            };
            user_swipes: {
                Row: {
                    created_at: string | null;
                    direction: string;
                    id: string;
                    swiper_id: string;
                    target_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    direction: string;
                    id?: string;
                    swiper_id: string;
                    target_id: string;
                };
                Update: {
                    created_at?: string | null;
                    direction?: string;
                    id?: string;
                    swiper_id?: string;
                    target_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "user_swipes_target_id_fkey";
                        columns: ["target_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["user_id"];
                    },
                ];
            };
        };
        Views: {
            enrollments_with_status: {
                Row: {
                    course_prof_id: number | null;
                    created_at: string | null;
                    id: number | null;
                    status: string | null;
                    term: string | null;
                    user_id: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "enrollments_course_prof_id_fkey";
                        columns: ["course_prof_id"];
                        isOneToOne: false;
                        referencedRelation: "course_professor";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "enrollments_student_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["user_id"];
                    },
                    {
                        foreignKeyName: "enrollments_term_fkey";
                        columns: ["term"];
                        isOneToOne: false;
                        referencedRelation: "terms";
                        referencedColumns: ["name"];
                    },
                ];
            };
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            friend_status: "pending" | "accepted" | "rejected";
            grade: "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D+" | "D" | "D-" | "F";
            grade_level: "Freshman" | "Sophomore" | "Junior" | "Senior";
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
              DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
          DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
      ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
      ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
      ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
        : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
      ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema["CompositeTypes"]
        | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
        : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
      ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
      : never;

export const Constants = {
    public: {
        Enums: {
            friend_status: ["pending", "accepted", "rejected"],
            grade: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"],
            grade_level: ["Freshman", "Sophomore", "Junior", "Senior"],
        },
    },
} as const;
