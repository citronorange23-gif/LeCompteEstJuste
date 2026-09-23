import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "onboarding_seen";

export const hasSeenOnboarding = async (): Promise<boolean> => {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === "true";
};

export const markOnboardingSeen = async (): Promise<void> => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
};