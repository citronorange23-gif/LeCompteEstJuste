import {
    applyHintPenalty,
    computeResult,
    genererPartie,
} from "@lcb/shared/algorithm";
import { prisma } from "./db";

export const recordSoloScore = async (
    playerId: string,
    scoreId: string,
    points: number
): Promise<number> => {
    if (
        typeof scoreId !== "string" ||
        scoreId.length === 0 ||
        scoreId.length > 64 ||
        !Number.isInteger(points) ||
        points < 0 ||
        points > 10
    ) {
        throw new Error("invalid_score");
    }

    const now = new Date();

    try {
        return await prisma.$transaction(async (transaction) => {
            await transaction.soloChallenge.create({
                data: {
                    id: scoreId,
                    playerId,
                    numbers: [],
                    target: 0,
                    solution: [],
                    hintsUsed: 0,
                    expiresAt: now,
                    completedAt: now,
                    pointsAwarded: points,
                },
            });

            await transaction.player.update({
                where: { id: playerId },
                data: { points: { increment: points } },
            });

            return points;
        });
    } catch (error) {
        // Score déjà enregistré (renvoi après une confirmation perdue)
        if ((error as { code?: string }).code === "P2002") return points;
        throw error;
    }
};