// server/validation.ts
const PSEUDO_MIN_LENGTH = 3;
const PSEUDO_MAX_LENGTH = 20;
const PSEUDO_REGEX = /^[a-zA-Z0-9À-ÿ_\- ]+$/;

const MOTS_INTERDITS: string[] = [];

export const validatePseudo = (pseudo: string): string | null => {
    const trimmed = pseudo.trim();

    if (trimmed.length < PSEUDO_MIN_LENGTH) {
        return `Le pseudo doit contenir au moins ${PSEUDO_MIN_LENGTH} caractères.`;
    }

    if (trimmed.length > PSEUDO_MAX_LENGTH) {
        return `Le pseudo ne peut pas dépasser ${PSEUDO_MAX_LENGTH} caractères.`;
    }

    if (!PSEUDO_REGEX.test(trimmed)) {
        return "Le pseudo contient des caractères non autorisés.";
    }

    const lower = trimmed.toLowerCase();
    if (MOTS_INTERDITS.some((mot) => lower.includes(mot))) {
        return "Ce pseudo n'est pas autorisé.";
    }

    return null; // valide
};