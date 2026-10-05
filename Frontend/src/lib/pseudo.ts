import AsyncStorage from "@react-native-async-storage/async-storage";

const PSEUDO_KEY = "lcb_pseudo";
const PSEUDO_SETUP_KEY = "lcb_pseudo_setup_done";

export const getSavedPseudo = async (): Promise<string | null> => {
    return AsyncStorage.getItem(PSEUDO_KEY);
};

export const savePseudo = async (pseudo: string): Promise<void> => {
    await AsyncStorage.multiSet([
        [PSEUDO_KEY, pseudo],
        [PSEUDO_SETUP_KEY, "true"],
    ]);
};

export const hasCompletedPseudoSetup = async (): Promise<boolean> => {
    const value = await AsyncStorage.getItem(PSEUDO_SETUP_KEY);
    return value === "true";
};