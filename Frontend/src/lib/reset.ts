import AsyncStorage from "@react-native-async-storage/async-storage";

export const resetLocalData = async () => {
    await AsyncStorage.clear(); // ou removeItem sur les clés précises
};