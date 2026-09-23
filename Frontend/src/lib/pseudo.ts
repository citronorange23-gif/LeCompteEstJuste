import AsyncStorage from "@react-native-async-storage/async-storage";

const PSEUDO_KEY = "lcb_pseudo";

export const getSavedPseudo = async (): Promise<string | null> => {
    return AsyncStorage.getItem(PSEUDO_KEY);
};

export const savePseudo = async (pseudo: string): Promise<void> => {
    await AsyncStorage.setItem(PSEUDO_KEY, pseudo);
};