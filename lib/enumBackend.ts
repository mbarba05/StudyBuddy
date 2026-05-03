export const TABLES = {
    //whenever we change or add tables, we have to change this file
    //in db calls use these instead of hardcoding
    USERS: "users",
    PROFILES: "profiles",
    MAJORS: "majors",
    COURSE_PROFESSOR: "course_professor",
    COURSES: "courses",
    PROFESSORS: "professors",
    ENROLLMENTS: "enrollments",
    TERMS: "terms",
    FRIENDSHIPS: "friendships",
    FRIEND_REQUESTS: "friend_requests",
    REVIEWS: "reviews",
    CONVERSATIONS: "conversations",
    CONVERSATION_MEMBERS: "conversation_members",
    MESSAGES: "messages",
    MESSAGE_ATTACHMENTS: "message_attachments",
    RECENTLY_VIEWED_PROF_FOR_USER: "recently_viewed_prof_for_user",
    RECENTLY_VIEWED_PROF_GLOBAL: "recently_viewed_prof_global",
    RECENT_USER_SEARCH: "recent_user_search",
    REVIEW_REPORTS: "review_reports",
};

export const FUNCTIONS = {
    GET_PROFILES_FOR_SEARCH: "get_profile_from_search",
    SEARCH_PROFILES_WITH_MUTUALS: "search_profiles_with_mutuals",
    CHECK_PENDING_REQUEST: "check_pending_request",
    ARE_FRIENDS: "are_friends",
    MUTUAL_FRIENDS: "mutual_friends",
    GET_USER_REVIEWS: "get_user_reviews",
    GET_USER_REVIEW_SCORES: "get_user_review_scores",
    GET_PROF_REVIEWS: "get_prof_reviews",
    VOTE_ON_REVIEW: "vote_on_review",
};

export const BUCKETS = { PROFILE_PICS: "profile-pictures", ATTACHMENTS: "chat-attatchments" };
