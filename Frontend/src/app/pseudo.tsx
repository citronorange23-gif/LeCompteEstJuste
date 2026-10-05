import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "../styles/styles";
import { mpStyles } from "../styles/multiplayerStyles";
import { savePseudo } from "../lib/pseudo";

export default function PseudoScreen() {
    const router = useRouter();
    const [pseudo, setPseudo] = useState("");
    const [error, setError] = useState<string | null>(null);

    const valider = async () => {
        const value = pseudo.trim();

        if (value.length < 3) {
            setError("Le pseudo doit contenir au moins 3 caractères");
            return;
        }

        await savePseudo(value);
        router.replace("/");
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={mpStyles.centered}>
                <Text style={styles.title}>Bienvenue !</Text>

                <Text style={mpStyles.label}>
                    Choisis ton pseudo permanent
                </Text>

                <TextInput
                    value={pseudo}
                    onChangeText={(t) => {
                        setPseudo(t);
                        setError(null);
                    }}
                    placeholder="Pseudo"
                    placeholderTextColor="#64748B"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={20}
                    style={[
                        mpStyles.pseudoInput,
                        error && mpStyles.pseudoInputError,
                    ]}
                />

                {error && <Text style={mpStyles.errorText}>{error}</Text>}

                <Pressable
                    onPress={valider}
                    disabled={pseudo.trim().length === 0}
                    style={mpStyles.primaryButton}
                >
                    <Text style={mpStyles.primaryButtonText}>Continuer</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}