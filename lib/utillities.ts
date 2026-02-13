export const parseLastName = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    return parts[parts.length - 1] || "";
};

export const validateClassInput = (code: string): boolean => {
    //2-6 chars, 1-3 ints, 1 optional char
    const pattern = /^[A-Za-z]{2,6}\s\d{1,3}[A-Za-z]?$/;
    return pattern.test(code);
};

export const validateProfName = (name: string): boolean => {
    const pattern = /^[\p{L}]+(?:[.’'\-–]\p{L}+)*(?:\s+[\p{L}]+(?:[.’'\-–]\p{L}+)*)+$/u;
    return pattern.test(name);
};

export const formatMessageTime = (dmSentAt: string): string => {
    const now = new Date();
    const sent = new Date(dmSentAt);

    if (Number.isNaN(sent.getTime())) return "";

    const diffMs = now.getTime() - sent.getTime();
    if (diffMs < 0) return "Just now";

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;
    const year = 365 * day;

    if (diffMs < minute) return "Just now";

    if (diffMs < hour) {
        const minutes = Math.floor(diffMs / minute);
        return `${minutes} min ago`;
    }

    if (diffMs < day) {
        const hours = Math.floor(diffMs / hour);
        return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    if (diffMs < week) {
        const days = Math.floor(diffMs / day);
        return `${days} day${days === 1 ? "" : "s"} ago`;
    }

    if (diffMs < month) {
        const weeks = Math.floor(diffMs / week);
        return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
    }

    if (diffMs < year) {
        const months = Math.floor(diffMs / month);
        return `${months} month${months === 1 ? "" : "s"} ago`;
    }

    const years = Math.floor(diffMs / year);
    return `${years} year${years === 1 ? "" : "s"} ago`;
};
