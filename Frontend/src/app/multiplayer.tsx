import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Modal, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles/styles";
import { mpStyles } from "../styles/multiplayerStyles";
import { getSavedPseudo } from "../lib/pseudo";
import { useMultiplayerMatch } from "../hooks/useMultiplayerMatch";
import { computeResult } from "@lcb/shared/algorithm";
import { handleInviteFriend } from "@/lib/invite";

type NumEntry = { id: number; value: number; used: boolean };
type HistoryEntry = { numbers: NumEntry[]; steps: string[]; nextId: number };

export default function Multiplayer() {
    const router = useRouter();
    const {
        phase,
        pseudoError,
        match,
        result,
        opponentAnswered,
        isOffline,
        register,
        submitAnswer,
        rejouer,
        quitter,
        annulerRecherche,
    } = useMultiplayerMatch();
    const [pseudoInput, setPseudoInput] = useState("");

    const [numbers, setNumbers] = useState<NumEntry[]>([]);
    const [nextId, setNextId] = useState(0);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [pendingOp, setPendingOp] = useState<string | null>(null);
    const [steps, setSteps] = useState<string[]>([]);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [remainingMs, setRemainingMs] = useState(0);

    const [confirmQuitVisible, setConfirmQuitVisible] = useState(false);

    const [waitSeconds, setWaitSeconds] = useState(0);

    useEffect(() => {
        if (phase !== "queue") {
            setWaitSeconds(0);
            return;
        }

        const interval = setInterval(() => {
            setWaitSeconds((s) => s + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [phase]);

    useEffect(() => {
        getSavedPseudo().then((saved) => {
            if (saved) setPseudoInput(saved);
        });
    }, []);

    useEffect(() => {
        if (!match) return;
        setNumbers(match.numbers.map((value, index) => ({ id: index, value, used: false })));
        setNextId(match.numbers.length);
        setSelectedId(null);
        setPendingOp(null);
        setSteps([]);
        setHistory([]); // 👈 reset l'historique à chaque nouveau match
        setSubmitted(false);
    }, [match]);

    useEffect(() => {
        if (!match) return;

        const tick = () => {
            const remaining = match.timeLimitMs - (Date.now() - match.startAt);
            setRemainingMs(Math.max(0, remaining));
        };

        tick();
        const interval = setInterval(tick, 250);
        return () => clearInterval(interval);
    }, [match]);

    const selectNumber = (id: number) => {
        if (submitted || remainingMs <= 0 || !match) return;

        const target = numbers.find((n) => n.id === id);
        if (!target || target.used) return;

        if (selectedId === null) {
            setSelectedId(id);
            return;
        }

        if (id === selectedId) {
            setSelectedId(null);
            setPendingOp(null);
            return;
        }

        if (pendingOp === null) {
            setSelectedId(id);
            return;
        }

        const first = numbers.find((n) => n.id === selectedId)!;
        const second = numbers.find((n) => n.id === id)!;

        const resultat = computeResult(first.value, pendingOp, second.value);

        if (resultat === null) {
            setSelectedId(id);
            setPendingOp(null);
            return;
        }

        // 👇 on sauvegarde l'état AVANT modification pour pouvoir revenir en arrière
        setHistory((prev) => [...prev, { numbers, steps, nextId }]);

        const nouveauNombre: NumEntry = {
    id: nextId,
    value: resultat,
    used: false,
};

const nouvelleListe = numbers.map((n) =>
    n.id === selectedId || n.id === id
        ? { ...n, used: true }
        : n
);

nouvelleListe.push(nouveauNombre);

const newSteps = [
    ...steps,
    `${first.value} ${pendingOp} ${second.value} = ${resultat}`,
];

setNumbers(nouvelleListe);
setNextId(nextId + 1);

// 👇 sélectionne automatiquement le nouveau nombre
setSelectedId(nouveauNombre.id);

setPendingOp(null);
setSteps(newSteps);

if (resultat === match.target) {
    submitAnswer(resultat, newSteps);
    setSubmitted(true);
}
    };

    // 👇 annulation
    const retourArriere = () => {
        if (history.length === 0 || submitted) return;

        const dernierEtat = history[history.length - 1];
        setNumbers(dernierEtat.numbers);
        setSteps(dernierEtat.steps);
        setNextId(dernierEtat.nextId);
        setHistory((prev) => prev.slice(0, -1));
        setSelectedId(null);
        setPendingOp(null);
    };

    const selectOperation = (op: string) => {
        if (selectedId === null || submitted || remainingMs <= 0) return;
        setPendingOp(op);
    };

    const selectedValue =
        selectedId !== null ? numbers.find((n) => n.id === selectedId)?.value : null;

    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const timerRatio = match ? Math.max(0, remainingMs / match.timeLimitMs) : 0;
    const timerLow = remainingSeconds <= 10;

    const winnerId = result?.winnerId ?? null;

    if (isOffline) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={mpStyles.centered}>
                    <Ionicons name="cloud-offline-outline" size={48} color="#64748B" />
                    <Text style={mpStyles.label}>Pas de connexion internet</Text>
                    <Pressable onPress={() => router.back()} style={mpStyles.secondaryButton}>
                        <Text style={mpStyles.secondaryButtonText}>Retour</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    if (phase === "menu") {
    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={mpStyles.centered}>
                <Text style={styles.title}>
                    1v1 Multijoueur
                </Text>

                <Text style={mpStyles.label}>
                    Prêt à affronter un adversaire ?
                </Text>

                <Pressable
                    onPress={rejouer}
                    style={mpStyles.primaryButton}
                >
                    <Text style={mpStyles.primaryButtonText}>
                        ⚔️ Trouver un adversaire
                    </Text>
                </Pressable>

                <Pressable onPress={handleInviteFriend} style={[mpStyles.primaryButton, { backgroundColor: "#10B981" }]}>
                    <Text style={mpStyles.primaryButtonText}>🔗 Inviter un ami</Text>
                </Pressable>

                <Pressable
                    onPress={() => {
                        quitter();
                        router.back();
                    }}
                    style={mpStyles.secondaryButton}
                >
                    <Text style={mpStyles.secondaryButtonText}>
                        Retour
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

    if (phase === "initializing" || phase === "connecting") {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={mpStyles.centered}>
                    <ActivityIndicator size="large" color="#6366F1" />
                </View>
            </SafeAreaView>
        );
    }

    if (phase === "pseudo") {
    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={mpStyles.centered}>
                <Text style={styles.title}>1v1 Multijoueur</Text>
                <Text style={mpStyles.label}>Choisis ton pseudo pour affronter un adversaire</Text>

                <TextInput
                    value={pseudoInput}
                    onChangeText={setPseudoInput}
                    placeholder="Pseudo"
                    placeholderTextColor="#64748B"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={20}
                    style={[mpStyles.pseudoInput, pseudoError && mpStyles.pseudoInputError]}
                />

                {pseudoError && <Text style={mpStyles.errorText}>{pseudoError}</Text>}

                <Pressable
                    onPress={() => pseudoInput.trim() && register(pseudoInput.trim())}
                    style={mpStyles.primaryButton}
                    disabled={pseudoInput.trim().length === 0}
                >
                    <Text style={mpStyles.primaryButtonText}>Jouer</Text>
                </Pressable>

                <Pressable onPress={() => router.back()} style={mpStyles.secondaryButton}>
                    <Text style={mpStyles.secondaryButtonText}>Retour</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

    if (phase === "queue") {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={mpStyles.centered}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={mpStyles.queueTitle}>Recherche d'un adversaire…</Text>

                    {waitSeconds >= 15 && (
                        <Text style={mpStyles.label}>
                            Ça prend plus de temps que prévu — reste un instant, ou réessaie plus tard.
                        </Text>
                    )}

                    <Pressable onPress={annulerRecherche} style={mpStyles.secondaryButton}>
                        <Text style={mpStyles.secondaryButtonText}>Annuler</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    if (phase === "match" && match) {
    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={mpStyles.matchHeader}>
                    <Text style={styles.subtitle}>Contre</Text>
                    <View style={mpStyles.opponentBadge}>
                        {opponentAnswered && <View style={mpStyles.opponentAnsweredDot} />}
                        <Text style={mpStyles.opponentName}>{match.opponent.pseudo}</Text>
                    </View>
                </View>

                <View style={mpStyles.timerBarTrack}>
                    <View
                        style={[
                            mpStyles.timerBarFill,
                            timerLow && mpStyles.timerBarFillLow,
                            { width: `${timerRatio * 100}%` },
                        ]}
                    />
                </View>
                <Text style={mpStyles.timerText}>{remainingSeconds}s restantes</Text>

                <View style={styles.targetContainer}>
                    <Text style={styles.targetLabel}>CIBLE</Text>
                    <Text style={styles.target}>{match.target}</Text>
                </View>

                <View style={styles.numbersContainer}>
                    {numbers.map((entry) => (
                        <Pressable
                            key={entry.id}
                            onPress={() => selectNumber(entry.id)}
                            disabled={entry.used || submitted}
                            style={[
                                styles.numberCard,
                                entry.used && styles.usedNumber,
                                selectedId === entry.id && styles.selectedNumber,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.number,
                                    entry.used && styles.usedNumberText,
                                    selectedId === entry.id && styles.selectedNumberText,
                                ]}
                            >
                                {entry.value}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                <View style={styles.operationContainer}>
                    <Text style={styles.sectionTitle}>Opération</Text>
                    <View style={styles.operations}>
                        {["+", "-", "×", "÷"].map((op) => (
                            <Pressable
                                key={op}
                                onPress={() => selectOperation(op)}
                                disabled={submitted}
                                style={[
                                    styles.operationButton,
                                    pendingOp === op && styles.selectedOperation,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.operationText,
                                        pendingOp === op && styles.selectedOperationText,
                                    ]}
                                >
                                    {op}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                <View style={styles.calculation}>
                    <Text style={styles.calculationText}>
                        {selectedValue !== null && selectedValue !== undefined
                            ? pendingOp
                                ? `${selectedValue} ${pendingOp} ...`
                                : `${selectedValue} → choisissez un autre nombre`
                            : "Sélectionnez un nombre"}
                    </Text>
                </View>

                {/* Étapes en cours */}
                {steps.length > 0 && (
                    <View style={styles.stepsContainer}>
                        {steps.map((step, index) => (
                            <Text key={index} style={styles.stepText}>
                                {step}
                            </Text>
                        ))}
                    </View>
                )}

                {/* Bouton Retour en arrière */}
                {history.length > 0 && !submitted && (
                    <Pressable onPress={retourArriere} style={styles.undoButton}>
                        <Text style={styles.undoText}>Retour en arrière</Text>
                    </Pressable>
                )}

                {/* Bouton Abandonner */}
                <Pressable
                    onPress={() => setConfirmQuitVisible(true)}
                    style={styles.abandonButton}
                >
                    <Text style={styles.abandonText}>Abandonner</Text>
                </Pressable>

                {submitted && (
                    <View style={mpStyles.waitingBanner}>
                        <Text style={mpStyles.waitingBannerText}>
                            Cible atteinte ! En attente du résultat…
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Modale de confirmation d'abandon */}
            <Modal
                visible={confirmQuitVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setConfirmQuitVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Abandonner ?</Text>
                        <Text style={styles.modalText}>
                            Voulez-vous vraiment quitter cette partie ? Vous serez déclaré
                            perdant.
                        </Text>

                        <View style={styles.modalActions}>
                            <Pressable
                                onPress={() => setConfirmQuitVisible(false)}
                                style={[styles.modalButton, styles.modalCancel]}
                            >
                                <Text style={styles.modalCancelText}>Annuler</Text>
                            </Pressable>

                            <Pressable
                                onPress={() => {
                                    setConfirmQuitVisible(false);
                                    quitter();
                                }}
                                style={[styles.modalButton, styles.modalConfirm]}
                            >
                                <Text style={styles.modalConfirmText}>Abandonner</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

    if (phase === "result" && result) {
        const opponentId = match?.opponent?.id;
        const self = result.players.find((p) => p.id !== opponentId);
        const opponent = result.players.find((p) => p.id === opponentId);

        const isWin = winnerId !== null && winnerId === self?.id;
        const isDraw = winnerId === null;
        const isLoss = winnerId !== null && winnerId !== self?.id;

        const bannerEmoji =
            result.reason === "opponent_disconnected"
                ? isWin
                    ? "🔌🏆"
                    : "🔌"
                : isWin
                ? "🏆"
                : isLoss
                ? "💔"
                : "🤝";
        const bannerTitle = isWin ? "Victoire !" : isLoss ? "Défaite" : "Match nul";
        const bannerColor = isWin ? "#10B981" : isLoss ? "#EF4444" : "#F59E0B";

        const reasonText =
            result.reason === "time_up"
                ? "Temps écoulé — personne n'a trouvé la cible"
                : result.reason === "opponent_left"
                ? "L'adversaire a quitté la partie"
                : result.reason === "opponent_disconnected"
                ? "L'adversaire s'est déconnecté"
                : isDraw
                ? "Égalité parfaite !"
                : "Victoire du plus rapide !";

        const bothFound =
            self?.elapsedMs != null && opponent?.elapsedMs != null && !isDraw;
        const timeDiff = bothFound
            ? Math.abs((self!.elapsedMs ?? 0) - (opponent!.elapsedMs ?? 0))
            : null;

        const renderPlayerCard = (
            p: (typeof result.players)[number],
            isMe: boolean
        ) => {
            const isWinner = p.id === winnerId;
            const found = p.value !== null;
            const isDraw = winnerId === null;

            // 🎭 Emoji selon le cas
            let emoji: string;
            if (isDraw) {
                emoji = found ? "🤝" : "😐";
            } else if (isWinner) {
                emoji = "👑";
            } else {
                emoji = found ? "🥈" : "💔";
            }

            return (
                <View
                    key={p.id}
                    style={[
                        mpStyles.playerCard,
                        isWinner && mpStyles.playerCardWinner,
                        isMe && mpStyles.playerCardSelf,
                    ]}
                >
                    <Text style={mpStyles.crownIcon}>{emoji}</Text>
                    <Text style={mpStyles.playerCardRole}>
                        {isMe ? "Toi" : "Adversaire"}
                    </Text>
                    <Text style={mpStyles.playerCardName} numberOfLines={1}>
                        {p.pseudo}
                    </Text>
                    <Text
                        style={[
                            mpStyles.playerCardTime,
                            !found && mpStyles.playerCardTimeFail,
                        ]}
                    >
                        {found ? `${((p.elapsedMs ?? 0) / 1000).toFixed(1)}s` : "—"}
                    </Text>
                    <Text style={mpStyles.playerCardStatus}>
                        {found ? "Cible atteinte" : "Pas trouvé"}
                    </Text>
                </View>
            );
        };

        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={mpStyles.centered}>
                    <View
                        style={[
                            mpStyles.resultBanner,
                            { borderColor: bannerColor },
                        ]}
                    >
                        <Text style={mpStyles.resultEmoji}>{bannerEmoji}</Text>
                        <Text
                            style={[
                                mpStyles.resultBannerTitle,
                                { color: bannerColor },
                            ]}
                        >
                            {bannerTitle}
                        </Text>
                        <Text style={mpStyles.resultSubtitle}>{reasonText}</Text>
                    </View>

                    <View style={mpStyles.targetPill}>
                        <Text style={mpStyles.targetPillLabel}>CIBLE</Text>
                        <Text style={mpStyles.targetPillValue}>
                            {match?.target}
                        </Text>
                    </View>

                    <View style={mpStyles.playersRow}>
                        {self && renderPlayerCard(self, true)}
                        {opponent && renderPlayerCard(opponent, false)}
                    </View>

                    {timeDiff !== null && (
                        <Text style={mpStyles.timeDiffText}>
                            Écart : {(timeDiff / 1000).toFixed(1)}s
                        </Text>
                    )}

                    <Pressable onPress={rejouer} style={mpStyles.primaryButton}>
                        <Text style={mpStyles.primaryButtonText}>Rejouer</Text>
                    </Pressable>

                    <Pressable
                        onPress={() => {
                            quitter();
                            router.back();
                        }}
                        style={mpStyles.secondaryButton}
                    >
                        <Text style={mpStyles.secondaryButtonText}>
                            Retour à l'accueil
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return null;
}