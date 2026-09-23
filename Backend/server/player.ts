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
    if (isDraw) {
        if (winnerId) {
            await prisma.player.update({
                where: { id: winnerId },
                data: { draws: { increment: 1 } },
            });
        }
        if (loserId) {
            await prisma.player.update({
                where: { id: loserId },
                data: { draws: { increment: 1 } },
            });
        }
        return;
    }

    if (winnerId) {
        await prisma.player.update({
            where: { id: winnerId },
            data: {
                wins: { increment: 1 },
                points: { increment: 1 },
            },
        });
    }

    if (loserId) {
        await prisma.player.update({
            where: { id: loserId },
            data: {
                losses: { increment: 1 },
                points: { decrement: 1 },
            },
        });
    }
};