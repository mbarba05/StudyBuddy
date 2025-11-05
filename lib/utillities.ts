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
