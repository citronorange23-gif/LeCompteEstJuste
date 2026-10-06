import { prisma } from "./db";
import {
    hashDeviceCredential,
    matchesDeviceCredential,
} from "./deviceCredential";

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
    pseudo: string,
    deviceCredential: string
) => {
    const deviceCredentialHash = hashDeviceCredential(deviceCredential);
    const existing = await prisma.player.findUnique({
        where: { id },
    });

    if (existing) {
        if (existing.deviceCredentialHash) {
            if (!matchesDeviceCredential(deviceCredential, existing.deviceCredentialHash)) {
                throw new Error("device_credential_invalid");
            }
            return existing;
        }

        await prisma.player.updateMany({
            where: { id, deviceCredentialHash: null },
            data: { deviceCredentialHash },
        });

        const claimed = await prisma.player.findUnique({ where: { id } });
        if (!claimed || claimed.deviceCredentialHash !== deviceCredentialHash) {
            throw new Error("device_credential_invalid");
        }
        return claimed;
    }

    try {
        return await prisma.player.create({
            data: { id, pseudo, deviceCredentialHash },
        });
    } catch (err) {
        if (isUniqueConstraintError(err)) {
            const credentialOwner = await prisma.player.findUnique({
                where: { deviceCredentialHash },
            });
            if (credentialOwner && credentialOwner.id !== id) {
                throw new Error("device_credential_in_use");
            }
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

