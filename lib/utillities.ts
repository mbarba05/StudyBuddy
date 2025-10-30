export const parseLastName = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return parts[parts.length - 1] || "";
};
