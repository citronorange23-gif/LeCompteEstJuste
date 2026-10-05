import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_VERSION_KEY = "lcb_storage_version";
const CURRENT_STORAGE_VERSION = "5";

export const migrateStorage = async (): Promise<void> => {
    const currentVersion = await AsyncStorage.getItem(
        STORAGE_VERSION_KEY
    );

    if (currentVersion === CURRENT_STORAGE_VERSION) {
        return;
    }

    console.log(
        `🔄 Migration storage ${currentVersion ?? "aucune"} → ${CURRENT_STORAGE_VERSION}`
    );

    await AsyncStorage.multiRemove([
        "lcb_player_id",
        "lcb_player_id_version",
        "lcb_pseudo",
    ]);

    await AsyncStorage.setItem(
        STORAGE_VERSION_KEY,
        CURRENT_STORAGE_VERSION
    );

    console.log("✅ Anciennes données joueur supprimées");
};