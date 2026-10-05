import AsyncStorage from "@react-native-async-storage/async-storage";

const PLAYER_ID_KEY = "lcb_player_id";

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