import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSavedPseudo } from "./pseudo";
import { getSocket } from "./socket";

const PLAYER_ID_KEY = "lcb_player_id";
let registeredSocketId: string | null = null;
let disconnectListenerAttached = false;

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
    const existing = await AsyncStorage.getItem(PLAYER_ID_KEY);

    if (existing) {
        return existing;
    }

    const id = generateUUID();

    await AsyncStorage.setItem(PLAYER_ID_KEY, id);

    return id;
};

export const submitSoloScore = async (points: number): Promise<void> => {
    const socket = getSocket();
    const [id, pseudo] = await Promise.all([
        getOrCreatePlayerId(),
        getSavedPseudo(),
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
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error("Connexion au serveur expirée."));
            }, 10_000);

            const cleanup = () => {
                clearTimeout(timeout);
                socket.off("connect", onConnect);
                socket.off("connect_error", onConnectError);
            };

            const onConnect = () => {
                cleanup();
                resolve();
            };

            const onConnectError = () => {
                cleanup();
                reject(new Error("Connexion au serveur impossible."));
            };

            socket.once("connect", onConnect);
            socket.once("connect_error", onConnectError);
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

            const onError = ({ message }: { message: string }) => {
                cleanup();
                reject(new Error(message));
            };

            socket.once("player:registered", onRegistered);
            socket.once("player:error", onError);
            socket.emit("player:register", { id, pseudo });
        });
    }

    await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error("Enregistrement du score expiré."));
        }, 10_000);

        const cleanup = () => {
            clearTimeout(timeout);
            socket.off("solo:score-recorded", onRecorded);
            socket.off("solo:score-error", onError);
        };

        const onRecorded = () => {
            cleanup();
            resolve();
        };

        const onError = ({ message }: { message: string }) => {
            cleanup();
            reject(new Error(message));
        };

        socket.once("solo:score-recorded", onRecorded);
        socket.once("solo:score-error", onError);
        socket.emit("solo:score", { points });
    });
};