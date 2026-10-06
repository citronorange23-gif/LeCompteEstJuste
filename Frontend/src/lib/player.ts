import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getSavedPseudo } from "./pseudo";
import { getSocket } from "./socket";

const PLAYER_ID_KEY = "lcb_player_id";
const DEVICE_CREDENTIAL_KEY = "lcb_device_credential";
const PENDING_SOLO_SCORES_KEY = "lcb_pending_solo_scores";
const SOCKET_CONNECT_TIMEOUT_MS = 60_000;
let registeredSocketId: string | null = null;
let disconnectListenerAttached = false;
let pendingSyncInProgress = false;
let registrationInProgress: Promise<ReturnType<typeof getSocket>> | null = null;

export type SoloOperation = {
    first: number;
    operator: "+" | "-" | "×" | "÷";
    second: number;
    result: number;
};

type PendingSoloScore = {
    challengeId: string;
    operations: SoloOperation[];
    hintsUsed: number;
};

export type ServerSoloChallenge = {
    challengeId: string;
    numbers: number[];
    target: number;
    totalHints: number;
    expiresAt: number;
};

export const isDeviceCredentialError = (
    error: unknown
): error is Error & { code: string } =>
    error instanceof Error &&
    "code" in error &&
    (error as Error & { code: string }).code.startsWith("device_credential_");

function generateUUID(): string {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;

            return v.toString(16);
        }
    );
}

export const getOrCreatePlayerId = async (): Promise<string> => {
    const isWeb = Platform.OS === "web";
    const read = isWeb
        ? () => AsyncStorage.getItem(PLAYER_ID_KEY)
        : () => SecureStore.getItemAsync(PLAYER_ID_KEY);
    const write = isWeb
        ? (id: string) => AsyncStorage.setItem(PLAYER_ID_KEY, id)
        : (id: string) => SecureStore.setItemAsync(PLAYER_ID_KEY, id);

    const existing = await read();

    if (existing) {
        return existing;
    }

    if (!isWeb) {
        const legacyId = await AsyncStorage.getItem(PLAYER_ID_KEY);
        if (legacyId) {
            await write(legacyId);
            await AsyncStorage.removeItem(PLAYER_ID_KEY);
            return legacyId;
        }
    }

    const id = generateUUID();

    await write(id);

    return id;
};

const getOrCreateDeviceCredential = async (): Promise<string> => {
    const read = Platform.OS === "web"
        ? () => AsyncStorage.getItem(DEVICE_CREDENTIAL_KEY)
        : () => SecureStore.getItemAsync(DEVICE_CREDENTIAL_KEY);
    const write = Platform.OS === "web"
        ? (credential: string) => AsyncStorage.setItem(DEVICE_CREDENTIAL_KEY, credential)
        : (credential: string) => SecureStore.setItemAsync(DEVICE_CREDENTIAL_KEY, credential);

    const existing = await read();
    if (existing && /^[a-f0-9]{64}$/i.test(existing)) return existing;

    const bytes = await Crypto.getRandomBytesAsync(32);
    const credential = Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    await write(credential);
    return credential;
};

const connectAndRegisterSocket = async () => {
    const socket = getSocket();
    const [id, pseudo, deviceCredential] = await Promise.all([
        getOrCreatePlayerId(),
        getSavedPseudo(),
        getOrCreateDeviceCredential(),
    ]);

    if (!pseudo) {
        throw new Error("Aucun pseudo enregistré sur cet appareil.");
    }

    if (!disconnectListenerAttached) {
        socket.on("disconnect", () => {
            registeredSocketId = null;
        });
        disconnectListenerAttached = true;
    }

    if (!socket.connected) {
        await new Promise<void>((resolve, reject) => {
            let lastConnectionError: string | null = null;
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error(
                    lastConnectionError
                        ? `Connexion au serveur impossible: ${lastConnectionError}`
                        : "Connexion au serveur expirée après plusieurs tentatives."
                ));
            }, SOCKET_CONNECT_TIMEOUT_MS);

            const cleanup = () => {
                clearTimeout(timeout);
                socket.off("connect", onConnect);
                socket.off("connect_error", onConnectError);
            };

            const onConnect = () => {
                cleanup();
                resolve();
            };

            const onConnectError = (error: Error) => {
                lastConnectionError = error.message;
            };

            socket.on("connect", onConnect);
            socket.on("connect_error", onConnectError);
            socket.connect();
        });
    }

    if (registeredSocketId !== socket.id) {
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error("Inscription au serveur expirée."));
            }, 10_000);

            const cleanup = () => {
                clearTimeout(timeout);
                socket.off("player:registered", onRegistered);
                socket.off("player:error", onError);
            };

            const onRegistered = () => {
                registeredSocketId = socket.id ?? null;
                cleanup();
                resolve();
            };

            const onError = ({ code, message }: { code: string; message: string }) => {
                cleanup();
                reject(Object.assign(new Error(message), { code }));
            };

            socket.once("player:registered", onRegistered);
            socket.once("player:error", onError);
            socket.emit("player:register", { id, pseudo, deviceCredential });
        });
    }

    return socket;
};

export const ensurePlayerSocketRegistered = async () => {
    if (!registrationInProgress) {
        registrationInProgress = connectAndRegisterSocket();
    }

    const registration = registrationInProgress;
    try {
        return await registration;
    } finally {
        if (registrationInProgress === registration) {
            registrationInProgress = null;
        }
    }
};

const readPendingSoloScores = async (): Promise<PendingSoloScore[]> => {
    const serialized = await AsyncStorage.getItem(PENDING_SOLO_SCORES_KEY);
    if (!serialized) return [];

    try {
        const pending = JSON.parse(serialized) as PendingSoloScore[];
        return Array.isArray(pending) ? pending : [];
    } catch {
        return [];
    }
};

const writePendingSoloScores = async (pending: PendingSoloScore[]) => {
    await AsyncStorage.setItem(
        PENDING_SOLO_SCORES_KEY,
        JSON.stringify(pending)
    );
};

const sendPendingSoloScore = async (
    socket: ReturnType<typeof getSocket>,
    pending: PendingSoloScore
): Promise<"saved" | "retry" | "rejected"> => new Promise((resolve) => {
    let settled = false;
    const timeout = setTimeout(() => finish("retry"), 10_000);

    const cleanup = () => {
        clearTimeout(timeout);
        socket.off("solo:score-recorded", onRecorded);
        socket.off("solo:error", onError);
    };

    const finish = (outcome: "saved" | "retry" | "rejected") => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(outcome);
    };

    const onRecorded = ({ challengeId }: { challengeId: string }) => {
        if (challengeId === pending.challengeId) finish("saved");
    };

    const onError = (payload: { challengeId?: string; retryable: boolean }) => {
        if (payload.challengeId === pending.challengeId) {
            finish(payload.retryable ? "retry" : "rejected");
        }
    };

    socket.on("solo:score-recorded", onRecorded);
    socket.on("solo:error", onError);
    socket.emit("solo:submit", pending);
});

export const syncPendingSoloScores = async (
    requestedChallengeId?: string
): Promise<"saved" | "queued" | "rejected" | void> => {
    if (pendingSyncInProgress) return requestedChallengeId ? "queued" : undefined;
    pendingSyncInProgress = true;

    try {
        const pending = await readPendingSoloScores();
        if (pending.length === 0) return requestedChallengeId ? "saved" : undefined;

        const socket = await ensurePlayerSocketRegistered();
        let requestedOutcome: "saved" | "queued" | "rejected" | undefined;
        for (const score of pending) {
            const outcome = await sendPendingSoloScore(socket, score);
            if (outcome === "retry") {
                if (score.challengeId === requestedChallengeId) requestedOutcome = "queued";
                break;
            }

            const remaining = (await readPendingSoloScores()).filter(
                (entry) => entry.challengeId !== score.challengeId
            );
            await writePendingSoloScores(remaining);

            if (score.challengeId === requestedChallengeId) {
                requestedOutcome = outcome;
            }
        }

        return requestedOutcome ?? (requestedChallengeId ? "queued" : undefined);
    } catch {
        // Keep queued results locally until a later connection succeeds.
        return requestedChallengeId ? "queued" : undefined;
    } finally {
        pendingSyncInProgress = false;
    }
};

export const watchPendingSoloScores = () => {
    const socket = getSocket();
    const onConnect = () => void syncPendingSoloScores();

    socket.on("connect", onConnect);
    void syncPendingSoloScores();

    return () => {
        socket.off("connect", onConnect);
    };
};

export const startSoloChallenge = async (): Promise<ServerSoloChallenge | null> => {
    try {
        const socket = await ensurePlayerSocketRegistered();
        void syncPendingSoloScores();

        return await new Promise((resolve) => {
            let settled = false;
            const timeout = setTimeout(() => finish(null), 10_000);

            const cleanup = () => {
                clearTimeout(timeout);
                socket.off("solo:challenge", onChallenge);
                socket.off("solo:error", onError);
            };

            const finish = (challenge: ServerSoloChallenge | null) => {
                if (settled) return;
                settled = true;
                cleanup();
                resolve(challenge);
            };

            const onChallenge = (challenge: ServerSoloChallenge) => finish(challenge);
            const onError = (payload: { challengeId?: string }) => {
                if (!payload.challengeId) finish(null);
            };

            socket.on("solo:challenge", onChallenge);
            socket.on("solo:error", onError);
            socket.emit("solo:challenge:start");
        });
    } catch (error) {
        if (isDeviceCredentialError(error)) throw error;
        return null;
    }
};

export const recordSoloHint = async (
    challengeId: string,
    hintIndex: number
): Promise<string | null> => {
    const socket = getSocket();
    if (!socket.connected || registeredSocketId !== socket.id) return null;

    return new Promise((resolve) => {
        let settled = false;
        const timeout = setTimeout(() => finish(null), 5_000);

        const cleanup = () => {
            clearTimeout(timeout);
            socket.off("solo:hint-revealed", onRevealed);
            socket.off("solo:error", onError);
        };

        const finish = (hint: string | null) => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve(hint);
        };

        const onRevealed = (payload: { challengeId: string; hintIndex: number; hint: string }) => {
            if (payload.challengeId === challengeId && payload.hintIndex === hintIndex) {
                finish(payload.hint);
            }
        };

        const onError = (payload: { challengeId?: string }) => {
            if (payload.challengeId === challengeId) finish(null);
        };

        socket.on("solo:hint-revealed", onRevealed);
        socket.on("solo:error", onError);
        socket.emit("solo:hint", { challengeId, hintIndex });
    });
};

export const submitSoloOperations = async (
    result: PendingSoloScore
): Promise<"saved" | "queued" | "rejected"> => {
    const pending = await readPendingSoloScores();
    if (!pending.some((entry) => entry.challengeId === result.challengeId)) {
        pending.push(result);
        await writePendingSoloScores(pending);
    }

    return (await syncPendingSoloScores(result.challengeId)) ?? "queued";
};