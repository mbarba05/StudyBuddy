const bannedWords = [
    "anus",
    "arse",
    "arsehole",
    "ass",
    "asshole",
    "bastard",
    "bitch",
    "bitches",
    "bollock",
    "bollocks",
    "boner",
    "boob",
    "boobs",
    "bullshit",
    "buttplug",
    "clit",
    "cock",
    "cocksucker",
    "crap",
    "cum",
    "cunt",
    "damn",
    "dick",
    "dildo",
    "dipshit",
    "douche",
    "douchebag",
    "dyke",
    "fag",
    "faggot",
    "fuck",
    "fucked",
    "fucker",
    "fuckers",
    "fucking",
    "goddamn",
    "hell",
    "homo",
    "jackass",
    "jerkoff",
    "jizz",
    "kike",
    "motherfucker",
    "motherfucking",
    "nutsack",
    "penis",
    "piss",
    "pissed",
    "porn",
    "prick",
    "pussy",
    "queer",
    "retard",
    "scrotum",
    "sex",
    "shit",
    "shits",
    "shitted",
    "shitty",
    "slut",
    "spic",
    "testicle",
    "tit",
    "tits",
    "titties",
    "twat",
    "vagina",
    "wanker",
    "whore",
];

function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function getMatchedBadWords(text: string): string[] {
    const normalized = normalizeText(text);

    return bannedWords.filter((word) => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\b${escaped}\\b`, "i");
        return regex.test(normalized);
    });
}

export function containsBadWords(text: string): boolean {
    return getMatchedBadWords(text).length > 0;
}