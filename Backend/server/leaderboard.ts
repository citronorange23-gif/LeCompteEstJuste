import { prisma } from "./db";

export const getTopPlayers = async (limit: number = 50) => {
    return prisma.player.findMany({
        orderBy: { points: "desc" },
        take: limit,
        select: { id: true, pseudo: true, points: true, wins: true, losses: true, draws: true },
    });
};