import "dotenv/config";
import { prisma } from "./db";
import { randomUUID } from "crypto";

const EXPIRATION_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export async function createGameInvite(playerId: string) {
    const expiresAt = new Date(Date.now() + EXPIRATION_DURATION_MS);

    const invite = await prisma.gameInvite.create({
        data: {
            playerId,
            gameId: randomUUID(),
            expiresAt,
            status: "PENDING",
        },
    });

    return invite;
}

export async function getAndValidateInvite(inviteId: string) {
    const invite = await prisma.gameInvite.findUnique({
        where: { id: inviteId },
        include: { player: true },
    });

    if (!invite) return { error: "not_found" };
    if (invite.status !== "PENDING") return { error: "already_used" };
    if (invite.expiresAt < new Date()) {
        await prisma.gameInvite.update({
            where: { id: inviteId },
            data: { status: "EXPIRED" },
        });
        return { error: "expired" };
    }

    return { invite };
}