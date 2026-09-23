import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { styles } from "../styles/styles";
import { obStyles } from "../styles/onboardingStyles";

type Props = {
    visible: boolean;
    onClose: () => void;
};

const REGLES = [
    {
        emoji: "🎯",
        titre: "Le but",
        texte: "Combine des nombres avec des opérations pour atteindre (ou t'approcher le plus possible de) la cible.",
    },
    {
        emoji: "🔢",
        titre: "Les opérations",
        texte: "Sélectionne un nombre, choisis une opération (+ − × ÷), puis un second nombre. Le résultat remplace les deux nombres utilisés.",
    },
    {
        emoji: "↩️",
        titre: "Retour en arrière",
        texte: "Tu peux annuler ta dernière combinaison si tu changes d'avis, tant que tu n'as pas validé.",
    },
    {
        emoji: "💡",
        titre: "Besoin d'aide ?",
        texte: "En mode solo, révèle les indices un par un si tu es bloqué.",
    },
    {
        emoji: "⚔️",
        titre: "Mode 1v1",
        texte: "Affronte un adversaire en temps réel sur la même cible — le plus proche ou le plus rapide gagne.",
    },
];

export default function OnboardingModal({ visible, onClose }: Props) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalCard, obStyles.card]}>
                    <Text style={styles.modalTitle}>
                        Comment jouer 🎲
                    </Text>

                    <ScrollView
                        style={obStyles.scroll}
                        showsVerticalScrollIndicator={false}
                    >
                        {REGLES.map((regle, index) => (
                            <View key={index} style={obStyles.regleRow}>
                                <Text style={obStyles.regleEmoji}>
                                    {regle.emoji}
                                </Text>

                                <View style={obStyles.regleTexte}>
                                    <Text style={obStyles.regleTitre}>
                                        {regle.titre}
                                    </Text>
                                    <Text style={obStyles.regleDescription}>
                                        {regle.texte}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <Pressable
                        onPress={onClose}
                        style={[styles.modalButton, styles.modalConfirm]}
                    >
                        <Text style={styles.modalConfirmText}>
                            C'est compris !
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}