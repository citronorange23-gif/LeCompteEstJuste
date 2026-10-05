import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import { styles } from "../../styles/homeStyles";
import OnboardingModal from "../../components/OnboardingModal";
import {
    hasSeenOnboarding,
    markOnboardingSeen,
} from "../../lib/onboarding";

export default function Home() {
    const router = useRouter();

    const [onboardingVisible, setOnboardingVisible] = useState(false);

    useEffect(() => {
        hasSeenOnboarding().then((seen) => {
            if (!seen) {
                setOnboardingVisible(true);
            }
        });
    }, []);

    const fermerOnboarding = () => {
        setOnboardingVisible(false);
        markOnboardingSeen();
    };

    return (
        <SafeAreaView
            style={styles.container}
            edges={["top"]}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>
                        Le Compte est Juste
                    </Text>

                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            marginTop: 3,
                        }}
                    >
                        <Text
                            style={[
                                styles.subtitle,
                                { marginTop: 0 },
                            ]}
                        >
                            Choisissez un mode de jeu
                        </Text>

                        <Pressable
                            onPress={() =>
                                setOnboardingVisible(true)
                            }
                            style={{
                                width: 22,
                                height: 22,
                                borderRadius: 11,
                                backgroundColor: "#1E293B",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            hitSlop={8}
                        >
                            <Ionicons
                                name="help-outline"
                                size={14}
                                color="#FFFFFF"
                            />
                        </Pressable>
                    </View>
                </View>

                <Pressable
                    onPress={() => router.push("/solo")}
                    style={[
                        styles.modeCard,
                        styles.soloCard,
                    ]}
                >
                    <Text style={styles.modeIcon}>
                        🎯
                    </Text>

                    <Text style={styles.modeTitle}>
                        Solo
                    </Text>

                    <Text style={styles.modeDescription}>
                        Entraînez-vous à votre rythme, sans
                        limite de temps
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() =>
                        router.push("/multiplayer")
                    }
                    style={[
                        styles.modeCard,
                        styles.multiplayerCard,
                    ]}
                >
                    <Text style={styles.modeIcon}>
                        ⚔️
                    </Text>

                    <Text style={styles.modeTitle}>
                        1v1 Multijoueur
                    </Text>

                    <Text style={styles.modeDescription}>
                        Affrontez un adversaire en temps réel,
                        chrono en main
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() =>
                        router.push("/leaderboard")
                    }
                    style={[
                        styles.leaderboardLink,
                        {
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                        },
                    ]}
                >
                    <MaterialIcons
                        name="leaderboard"
                        size={20}
                        color="#FFD700"
                    />

                    <Text
                        style={
                            styles.leaderboardLinkText
                        }
                    >
                        Voir le classement mondial
                    </Text>
                </Pressable>
            </View>

            <OnboardingModal
                visible={onboardingVisible}
                onClose={fermerOnboarding}
            />
        </SafeAreaView>
    );
}