import { prisma } from "./db";

const isUniqueConstraintError = (
    err: unknown
): err is { code: string } => {
    return (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: unknown }).code === "P2002"
    );
};

export const registerOrGetPlayer = async (
    id: string,
    pseudo: string
) => {
    const existing = await prisma.player.findUnique({
        where: { id },
    });

    if (existing) {
        return existing;
    }

    try {
        return await prisma.player.create({
            data: { id, pseudo },
        });
    } catch (err) {
        if (isUniqueConstraintError(err)) {
            throw new Error("pseudo_taken");
        }
        throw err;
    }
};

export const recordMatchResult = async (
    winnerId: string | null,
    loserId: string | null,
    isDraw: boolean = false
) => {
    const DRAW_POINTS = 3;
    const WIN_POINTS = 15;

    if (isDraw) {
        if (winnerId) {
            await prisma.player.update({
                where: { id: winnerId },
                data: {
                    draws: { increment: 1 },
                    points: { increment: DRAW_POINTS },
                },
            });
        }
        if (loserId) {
            await prisma.player.update({
                where: { id: loserId },
                data: {
                    draws: { increment: 1 },
                    points: { increment: DRAW_POINTS },
                },
            });
        }
        return;
    }

    if (winnerId) {
        await prisma.player.update({
            where: { id: winnerId },
            data: {
                wins: { increment: 1 },
                points: { increment: WIN_POINTS },
            },
        });
    }

    if (loserId) {
        await prisma.player.update({
            where: { id: loserId },
            data: {
                losses: { increment: 1 },
            },
        });
    }
};

export const recordSoloScore = async (
    playerId: string,
    points: number
) => {
    await prisma.player.update({
        where: { id: playerId },
        data: { points: { increment: points } },
    });
};

