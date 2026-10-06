import { randomUUID } from "crypto";
import {
    applyHintPenalty,
    computeResult,
    genererPartie,
} from "@lcb/shared/algorithm";
import { prisma } from "./db";

const CHALLENGE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export type SoloOperation = {
    first: number;
    operator: "+" | "-" | "×" | "÷";
    second: number;
    result: number;
};

export const validateSoloOperations = (
    numbers: number[],
    target: number,
    operations: SoloOperation[]
): boolean => {
    if (operations.length < 3) return false;

    const remaining = [...numbers];

    for (const [index, operation] of operations.entries()) {
        if (
            !Number.isFinite(operation.first) ||
            !Number.isFinite(operation.second) ||
            !Number.isFinite(operation.result)
        ) {
            return false;
        }

        const firstIndex = remaining.indexOf(operation.first);
        if (firstIndex < 0) return false;

        const secondIndex = remaining.findIndex(
            (value, candidateIndex) =>
                value === operation.second && candidateIndex !== firstIndex
        );
        if (secondIndex < 0) return false;

        const result = computeResult(
            operation.first,
            operation.operator,
            operation.second
        );
        if (result === null || result !== operation.result) return false;

        remaining.splice(Math.max(firstIndex, secondIndex), 1);
        remaining.splice(Math.min(firstIndex, secondIndex), 1);
        remaining.push(result);

        if (result === target && index !== operations.length - 1) {
            return false;
        }
    }

    return operations[operations.length - 1].result === target;
};

export const calculateSoloPoints = (
    hintsUsed: number,
    totalHints: number
): number => {
    return applyHintPenalty(10, hintsUsed, totalHints);
};

export const createSoloChallenge = async (playerId: string) => {
    const game = genererPartie();
    const challengeId = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CHALLENGE_DURATION_MS);

    await prisma.soloChallenge.deleteMany({
        where: { playerId, expiresAt: { lte: now } },
    });

    await prisma.soloChallenge.create({
        data: {
            id: challengeId,
            playerId,
            numbers: game.numbers,
            target: game.target,
            solution: game.solution,
            expiresAt,
        },
    });

    return {
        challengeId,
        numbers: game.numbers,
        target: game.target,
        totalHints: game.solution.length,
        expiresAt: expiresAt.getTime(),
    };
};

export const revealSoloHint = async (
    challengeId: string,
    playerId: string,
    requestedHintIndex: number
) => {
    const challenge = await prisma.soloChallenge.findFirst({
        where: {
            id: challengeId,
            playerId,
            completedAt: null,
            expiresAt: { gt: new Date() },
        },
        select: { hintsUsed: true, solution: true },
    });

    if (!challenge) throw new Error("challenge_unavailable");
    if (
        !Number.isInteger(requestedHintIndex) ||
        requestedHintIndex < 0 ||
        requestedHintIndex >= challenge.solution.length
    ) {
        throw new Error("invalid_hint_index");
    }

    if (requestedHintIndex < challenge.hintsUsed) {
        return {
            hintIndex: requestedHintIndex,
            hintsUsed: challenge.hintsUsed,
            hint: challenge.solution[requestedHintIndex],
        };
    }
    if (requestedHintIndex > challenge.hintsUsed) {
        throw new Error("hint_out_of_order");
    }

    const updated = await prisma.soloChallenge.updateMany({
        where: {
            id: challengeId,
            playerId,
            hintsUsed: requestedHintIndex,
            completedAt: null,
            expiresAt: { gt: new Date() },
        },
        data: { hintsUsed: { increment: 1 } },
    });

    if (updated.count !== 1) {
        const current = await prisma.soloChallenge.findFirst({
            where: { id: challengeId, playerId, expiresAt: { gt: new Date() } },
            select: { hintsUsed: true, solution: true },
        });
        if (current && current.hintsUsed > requestedHintIndex) {
            return {
                hintIndex: requestedHintIndex,
                hintsUsed: current.hintsUsed,
                hint: current.solution[requestedHintIndex],
            };
        }
        throw new Error("hint_unavailable");
    }

    return {
        hintIndex: requestedHintIndex,
        hintsUsed: requestedHintIndex + 1,
        hint: challenge.solution[requestedHintIndex],
    };
};

export const submitSoloChallenge = async (
    challengeId: string,
    playerId: string,
    operations: SoloOperation[],
    hintsUsed: number
): Promise<number> => {
    const challenge = await prisma.soloChallenge.findFirst({
        where: { id: challengeId, playerId },
    });

    if (!challenge) throw new Error("challenge_not_found");
    if (challenge.completedAt && challenge.pointsAwarded !== null) {
        return challenge.pointsAwarded;
    }
    if (challenge.expiresAt <= new Date()) throw new Error("challenge_expired");
    if (
        !Number.isInteger(hintsUsed) ||
        hintsUsed < 0 ||
        hintsUsed > challenge.solution.length
    ) {
        throw new Error("invalid_hint_count");
    }
    if (!validateSoloOperations(challenge.numbers, challenge.target, operations)) {
        throw new Error("invalid_solution");
    }

    const recordedHints = Math.max(challenge.hintsUsed, hintsUsed);
    const points = calculateSoloPoints(recordedHints, challenge.solution.length);
    const completedAt = new Date();

    return prisma.$transaction(async (transaction) => {
        const updated = await transaction.soloChallenge.updateMany({
            where: {
                id: challengeId,
                playerId,
                completedAt: null,
                expiresAt: { gt: completedAt },
            },
            data: {
                hintsUsed: recordedHints,
                pointsAwarded: points,
                completedAt,
            },
        });

        if (updated.count === 0) {
            const completed = await transaction.soloChallenge.findFirst({
                where: { id: challengeId, playerId, completedAt: { not: null } },
                select: { pointsAwarded: true },
            });
            if (completed?.pointsAwarded !== null && completed?.pointsAwarded !== undefined) {
                return completed.pointsAwarded;
            }
            throw new Error("challenge_unavailable");
        }

        await transaction.player.update({
            where: { id: playerId },
            data: { points: { increment: points } },
        });

        return points;
    });
};