export const randomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const shuffle = <T,>(array: T[]): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};

export const arrondir = (nombre: number, multiple: number): number => {
    const resultat = multiple * Math.round(nombre / multiple);
    return resultat > 0 ? resultat : multiple;
};

export type SolveEntry = { steps: number; path: string[] };

export const computeReachableMap = (nums: number[]): Map<number, SolveEntry> => {
    const n = nums.length;
    const memo = new Map<number, Map<number, SolveEntry>>();

    const solve = (mask: number): Map<number, SolveEntry> => {
        const cached = memo.get(mask);
        if (cached) return cached;

        const result = new Map<number, SolveEntry>();

        const indices: number[] = [];
        for (let i = 0; i < n; i++) {
            if (mask & (1 << i)) indices.push(i);
        }

        if (indices.length === 1) {
            result.set(nums[indices[0]], { steps: 0, path: [] });
            memo.set(mask, result);
            return result;
        }

        for (let sub = (mask - 1) & mask; sub > 0; sub = (sub - 1) & mask) {
            const other = mask ^ sub;
            if (sub < other) continue;

            const leftMap = solve(sub);
            const rightMap = solve(other);

            for (const [lv, left] of leftMap) {
                for (const [rv, right] of rightMap) {
                    const steps = left.steps + right.steps + 1;

                    const operations: { val: number; ligne: string }[] = [
                        { val: lv + rv, ligne: `${lv} + ${rv} = ${lv + rv}` },
                        { val: lv * rv, ligne: `${lv} × ${rv} = ${lv * rv}` },
                    ];

                    if (lv > rv) {
                        operations.push({ val: lv - rv, ligne: `${lv} - ${rv} = ${lv - rv}` });
                    } else if (rv > lv) {
                        operations.push({ val: rv - lv, ligne: `${rv} - ${lv} = ${rv - lv}` });
                    }

                    if (rv !== 0 && lv % rv === 0) {
                        operations.push({ val: lv / rv, ligne: `${lv} ÷ ${rv} = ${lv / rv}` });
                    }
                    if (lv !== 0 && rv % lv === 0) {
                        operations.push({ val: rv / lv, ligne: `${rv} ÷ ${lv} = ${rv / lv}` });
                    }

                    for (const { val, ligne } of operations) {
                        if (val <= 0) continue;

                        const existant = result.get(val);
                        if (existant === undefined || steps < existant.steps) {
                            result.set(val, {
                                steps,
                                path: [...left.path, ...right.path, ligne],
                            });
                        }
                    }
                }
            }
        }

        memo.set(mask, result);
        return result;
    };

    const global = new Map<number, SolveEntry>();

    for (let mask = 1; mask < (1 << n); mask++) {
        const subset = solve(mask);

        for (const [val, entry] of subset) {
            const existant = global.get(val);
            if (existant === undefined || entry.steps < existant.steps) {
                global.set(val, entry);
            }
        }
    }

    return global;
};

const TARGET_MIN_STEPS = 3;
const TARGET_MIN = 100;
const TARGET_MAX = 999;

export const choisirCible = (
    nums: number[]
): { target: number; solution: string[] } | null => {
    const reachable = computeReachableMap(nums);

    const candidats: { target: number; solution: string[] }[] = [];

    for (const [val, entry] of reachable) {
        if (
            entry.steps >= TARGET_MIN_STEPS &&
            val >= TARGET_MIN &&
            val <= TARGET_MAX &&
            !nums.includes(val)
        ) {
            candidats.push({ target: val, solution: entry.path });
        }
    }

    if (candidats.length === 0) return null;

    return candidats[randomInt(0, candidats.length - 1)];
};

export type Game = {
    numbers: number[];
    target: number;
    solution: string[];
};

const PETIT_COUNT = 4;
const PETIT_MIN = 1;
const PETIT_MAX = 10;

const GRAND_COUNT = 2;
const GRAND_MIN = 11;
const GRAND_MAX = 50;

const MAX_ROUND_TENTATIVES = 500;

const tropDeDoublons = (nums: number[]): boolean => {
    const counts = new Map<number, number>();
    let nbValeursDoublees = 0;

    for (const n of nums) {
        const c = (counts.get(n) ?? 0) + 1;
        if (c > 2) return true;
        counts.set(n, c);
        if (c === 2) nbValeursDoublees++;
    }

    return nbValeursDoublees > 1;
};

export const genererPartie = (): Game => {
    let tentatives = 0;

    while (true) {
        tentatives++;

        const petitsNums = Array.from({ length: PETIT_COUNT }, () =>
            randomInt(PETIT_MIN, PETIT_MAX)
        );
        const grandsNums = Array.from({ length: GRAND_COUNT }, () =>
            randomInt(GRAND_MIN, GRAND_MAX)
        );

        const nums = shuffle([...petitsNums, ...grandsNums]);

        const nombreArrondis = randomInt(1, 4);
        const indexes = shuffle(
            Array.from({ length: nums.length }, (_, i) => i)
        ).slice(0, nombreArrondis);

        for (const index of indexes) {
            const multiple = Math.random() < 0.5 ? 5 : 10;
            nums[index] = arrondir(nums[index], multiple);
        }

        if (tropDeDoublons(nums)) continue;

        const resultat = choisirCible(nums);

        if (resultat !== null) {
            return {
                numbers: nums,
                target: resultat.target,
                solution: resultat.solution,
            };
        }

        if (tentatives >= MAX_ROUND_TENTATIVES) {
            return {
                numbers: [1, 2, 3, 4, 25, 50],
                target: 999,
                solution: [
                    "50 × 25 = 1250",
                    "1250 - 4 = 1246",
                    "1246 - 3 = 1243",
                    "1243 - 2 = 1241",
                    "1241 - 1 = 1240",
                ],
            };
        }
    }
};

export const computeResult = (a: number, op: string, b: number): number | null => {
    switch (op) {
        case "+":
            return a + b;
        case "-": {
            const diff = a - b;
            if (diff > 0) return diff;
            const diffInverse = b - a;
            return diffInverse > 0 ? diffInverse : null;
        }
        case "×":
            return a * b;
        case "÷": {
            if (b !== 0 && a % b === 0) return a / b;
            if (a !== 0 && b % a === 0) return b / a;
            return null;
        }
        default:
            return null;
    }
};

export const computeScore = (diff: number): number => {
    if (diff === 0) return 10;
    if (diff <= 5) return 10 - diff;
    if (diff <= 10) return 3;
    return 0;
};