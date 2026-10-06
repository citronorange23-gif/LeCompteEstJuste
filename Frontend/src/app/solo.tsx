import { useEffect, useMemo, useRef, useState } from "react";
import {
    ScrollView,
    View,
    Text,
    Pressable,
    Modal,
    Platform,
    ActivityIndicator,
} from "react-native";
import { styles } from "../styles/styles";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
    genererPartie,
    computeResult,
    computeScore,
    computeReachableMap,
    applyHintPenalty,
    type Game,
} from "@lcb/shared/algorithm";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigationBar } from "expo-navigation-bar";
import {
    recordSoloHint,
    startSoloChallenge,
    submitSoloOperations,
    syncPendingSoloScores,
    isDeviceCredentialError,
    type SoloOperation,
} from "../lib/player";
import { getSocket } from "../lib/socket";

type NumEntry = { id: number; value: number; used: boolean };

type HistoryEntry = {
    numbers: NumEntry[];
    steps: string[];
    nextId: number;
    operations: SoloOperation[];
};

export default function Solo() {
    const router = useRouter();

    const [game, setGame] = useState<Game>(() => genererPartie());
    const [isStartingGame, setIsStartingGame] = useState(true);
    const [challengeId, setChallengeId] = useState<string | null>(null);
    const challengeIdRef = useRef<string | null>(null);
    const [rankedEligible, setRankedEligible] = useState(false);
    const [identityError, setIdentityError] = useState<string | null>(null);
    const [totalHints, setTotalHints] = useState(game.solution.length);
    const [revealedHints, setRevealedHints] = useState<string[]>([]);
    const [hintRequestError, setHintRequestError] = useState<string | null>(null);

    const [numbers, setNumbers] = useState<NumEntry[]>(() =>
        game.numbers.map((value, index) => ({ id: index, value, used: false }))
    );
    const [nextId, setNextId] = useState(game.numbers.length);

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [pendingOp, setPendingOp] = useState<string | null>(null);
    const [steps, setSteps] = useState<string[]>([]);
    const [operations, setOperations] = useState<SoloOperation[]>([]);
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    const [validated, setValidated] = useState(false);
    const [score, setScore] = useState<number | null>(null);

    const [confirmVisible, setConfirmVisible] = useState(false);
    const [solutionVisible, setSolutionVisible] = useState(false);
    const [hintsRevealed, setHintsRevealed] = useState(0);
    const [isRevealingHint, setIsRevealingHint] = useState(false);
    const [scoreSaveStatus, setScoreSaveStatus] = useState<"idle" | "saving" | "saved" | "queued" | "unranked" | "rejected" | "error">("idle");
    const scoreSubmitted = useRef(false);

    useEffect(() => {
        if (Platform.OS === "android") {
            NavigationBar.setHidden(true);
            NavigationBar.setStyle("dark");
        }
    }, []);

    const nouvellePartie = async () => {
        setIsStartingGame(true);
        setSolutionVisible(false);
        setConfirmVisible(false);
        setRankedEligible(false);
        setChallengeId(null);
        challengeIdRef.current = null;

        let serverChallenge;
        try {
            serverChallenge = await startSoloChallenge();
            setIdentityError(null);
        } catch (error) {
            if (!isDeviceCredentialError(error)) throw error;
            setIdentityError(error.message);
            setIsStartingGame(false);
            return;
        }
        const nouvelleGame: Game = serverChallenge
            ? {
                  numbers: serverChallenge.numbers,
                  target: serverChallenge.target,
                  solution: [],
              }
            : genererPartie();

        setGame(nouvelleGame);
        setTotalHints(serverChallenge?.totalHints ?? nouvelleGame.solution.length);
        setChallengeId(serverChallenge?.challengeId ?? null);
        challengeIdRef.current = serverChallenge?.challengeId ?? null;
        setRankedEligible(serverChallenge !== null);
        setNumbers(
            nouvelleGame.numbers.map((value, index) => ({
                id: index,
                value,
                used: false,
            }))
        );
        setNextId(nouvelleGame.numbers.length);
        setSelectedId(null);
        setPendingOp(null);
        setSteps([]);
        setOperations([]);
        setHistory([]);
        setValidated(false);
        setScore(null);
        setHintsRevealed(0);
        setRevealedHints([]);
        setHintRequestError(null);
        setIsRevealingHint(false);
        setScoreSaveStatus("idle");
        scoreSubmitted.current = false;
        setIsStartingGame(false);
    };

    useEffect(() => {
        void nouvellePartie();

        const socket = getSocket();
        const onConnect = () => void syncPendingSoloScores();
        const onScoreRecorded = ({ challengeId: savedChallengeId }: { challengeId: string }) => {
            if (savedChallengeId === challengeIdRef.current) {
                setScoreSaveStatus("saved");
            }
        };
        const onScoreError = (payload: {
            challengeId?: string;
            retryable: boolean;
        }) => {
            if (payload.challengeId !== challengeIdRef.current) return;
            setScoreSaveStatus(payload.retryable ? "queued" : "rejected");
        };

        socket.on("connect", onConnect);
        socket.on("solo:score-recorded", onScoreRecorded);
        socket.on("solo:error", onScoreError);

        return () => {
            socket.off("connect", onConnect);
            socket.off("solo:score-recorded", onScoreRecorded);
            socket.off("solo:error", onScoreError);
        };
    }, []);

    const demanderNouvellePartie = () => {
        setSolutionVisible(false);

        if (validated) {
            void nouvellePartie();
            return;
        }
        setConfirmVisible(true);
    };

    const confirmerNouvellePartie = () => {
        setConfirmVisible(false);
        void nouvellePartie();
    };

    const revelerIndiceSuivant = async () => {
        if (validated || isRevealingHint || hintsRevealed >= totalHints) return;

        setIsRevealingHint(true);
        let revealedHint: string | undefined;
        if (challengeId && rankedEligible) {
            revealedHint = (await recordSoloHint(challengeId, hintsRevealed)) ?? undefined;
        } else {
            revealedHint = game.solution[hintsRevealed];
        }

        if (!revealedHint) {
            setHintRequestError("Reconnecte-toi au serveur pour recevoir cet indice.");
            setIsRevealingHint(false);
            return;
        }

        setRevealedHints((previous) => [...previous, revealedHint]);
        setHintsRevealed((previous) => Math.min(previous + 1, totalHints));
        setHintRequestError(null);
        setIsRevealingHint(false);
    };

    const ouvrirIndices = () => {
        if (validated) return;

        setSolutionVisible(true);
        if (hintsRevealed === 0) void revelerIndiceSuivant();
    };

    const indiceSuivant = () => {
        void revelerIndiceSuivant();
    };

    const selectNumber = (id: number) => {
        if (validated) return;

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

        setHistory((prev) => [...prev, { numbers, steps, nextId, operations }]);

        const operation: SoloOperation = {
            first: first.value,
            operator: pendingOp as SoloOperation["operator"],
            second: second.value,
            result: resultat,
        };
        const newOperations = [...operations, operation];

        const nouveauNombre: NumEntry = {
            id: nextId,
            value: resultat,
            used: false,
        };

        const nouvelleListe = numbers.map((n) =>
            n.id === selectedId || n.id === id ? { ...n, used: true } : n
        );

        nouvelleListe.push(nouveauNombre);

        setNumbers(nouvelleListe);
        setNextId(nextId + 1);
        setSelectedId(nouveauNombre.id);
        setPendingOp(null);
        setSteps((prev) => [
            ...prev,
            `${first.value} ${pendingOp} ${second.value} = ${resultat}`,
        ]);
        setOperations(newOperations);

        if (resultat === game.target) {
            valider(nouvelleListe, newOperations);
        }
    };

    const retourArriere = () => {
        if (history.length === 0 || validated) return;

        const dernierEtat = history[history.length - 1];

        setNumbers(dernierEtat.numbers);
        setSteps(dernierEtat.steps);
        setNextId(dernierEtat.nextId);
        setOperations(dernierEtat.operations);
        setHistory((prev) => prev.slice(0, -1));
        setSelectedId(null);
        setPendingOp(null);
    };

    const selectOperation = (op: string) => {
        if (selectedId === null || validated) return;
        setPendingOp(op);
    };

    const sauvegarderScore = async (submittedOperations: SoloOperation[]) => {
        if (!challengeId || !rankedEligible) {
            setScoreSaveStatus("unranked");
            return;
        }

        setScoreSaveStatus("saving");
        try {
            const result = await submitSoloOperations({
                challengeId,
                operations: submittedOperations,
                hintsUsed: hintsRevealed,
            });
            setScoreSaveStatus(result);
        } catch (error) {
            console.error("Erreur mise en attente du score solo:", error);
            setScoreSaveStatus("error");
        }
    };

    const valider = (
        liste: NumEntry[] = numbers,
        submittedOperations: SoloOperation[] = operations
    ) => {
        if (validated || scoreSubmitted.current) return;

        setValidated(true);
        setSolutionVisible(false);

        const ecart = liste
            .filter((n) => !n.used)
            .reduce(
                (min, n) => Math.min(min, Math.abs(n.value - game.target)),
                Infinity
            );

        const baseScore = computeScore(ecart);
        const finalScore = applyHintPenalty(
            baseScore,
            hintsRevealed,
            totalHints
        );

        setScore(finalScore);
        scoreSubmitted.current = true;
        void sauvegarderScore(submittedOperations);
    };

    const selectedValue =
        selectedId !== null
            ? numbers.find((n) => n.id === selectedId)?.value
            : null;

    const currentPotentialScore = useMemo(() => {
        const remainingNumbers = numbers
            .filter((n) => !n.used)
            .map((n) => n.value);
        const reachableValues = computeReachableMap(remainingNumbers);
        const bestReachableDifference = Array.from(reachableValues.keys())
            .reduce(
                (best, value) => Math.min(best, Math.abs(value - game.target)),
                Infinity
            );

        return applyHintPenalty(
            computeScore(bestReachableDifference),
            hintsRevealed,
            totalHints
        );
    }, [game.target, hintsRevealed, numbers, totalHints]
    );
    const potentialScoreColor = currentPotentialScore === 0
        ? "#FBBF24"
        : currentPotentialScore <= 3
            ? "#FB923C"
            : currentPotentialScore <= 6
                ? "#FDE047"
                : "#86EFAC";

    if (isStartingGame) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <ActivityIndicator size="large" color="#FBBF24" />
                </View>
            </SafeAreaView>
        );
    }

    if (identityError) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
                    <Text style={styles.subtitle}>{identityError}</Text>
                    <Pressable
                        onPress={() => void nouvellePartie()}
                        style={styles.newGameButton}
                    >
                        <Text style={styles.newGameText}>Réessayer</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Pressable
                        onPress={() => router.back()}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: "#1E293B",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                        }}
                    >
                        <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
                    </Pressable>

                    <Text style={styles.title}>Le Compte est Bon</Text>
                    <Text style={styles.subtitle}>Trouvez le nombre cible</Text>
                </View>

                <View style={styles.targetContainer}>
                    <Text style={styles.targetLabel}>CIBLE</Text>
                    <Text style={styles.target}>{game.target}</Text>
                </View>

                {validated && (
                    <View
                        style={[
                            styles.resultBanner,
                            styles.scoreBanner,
                        ]}
                    >
                        <Text style={styles.resultText}>
                            Combinaison trouvée ! {score} points gagnés
                        </Text>
                        <Text style={styles.subtitle}>
                            {scoreSaveStatus === "saving"
                                ? "Enregistrement au classement..."
                                : scoreSaveStatus === "queued"
                                    ? "Score en attente de connexion"
                                    : scoreSaveStatus === "unranked"
                                        ? "Score non classé : défi serveur indisponible"
                                        : scoreSaveStatus === "rejected"
                                            ? "Score refusé : solution ou défi invalide"
                                : scoreSaveStatus === "saved"
                                    ? "Score ajouté au classement"
                                    : scoreSaveStatus === "error"
                                        ? "Score non enregistré au classement"
                                        : ""}
                        </Text>
                        {(scoreSaveStatus === "error" || scoreSaveStatus === "queued") && score !== null && (
                            <Pressable onPress={() => void sauvegarderScore(operations)}>
                                <Text style={styles.solutionButtonText}>
                                    {scoreSaveStatus === "queued"
                                        ? "Réessayer la synchronisation"
                                        : "Réessayer l’enregistrement"}
                                </Text>
                            </Pressable>
                        )}
                    </View>
                )}

                <View style={styles.numbersContainer}>
                    {numbers.map((entry) => (
                        <Pressable
                            key={entry.id}
                            onPress={() => selectNumber(entry.id)}
                            disabled={entry.used}
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
                                : `${selectedValue} → choisissez une opération`
                            : "Sélectionnez un nombre"}
                    </Text>
                </View>

                {steps.length > 0 && (
                    <View style={styles.stepsContainer}>
                        {steps.map((step, index) => (
                            <Text key={index} style={styles.stepText}>
                                {step}
                            </Text>
                        ))}
                    </View>
                )}

                {!validated && (
                    <Text style={[styles.subtitle, { color: potentialScoreColor }]}>
                        Points : {currentPotentialScore}
                    </Text>
                )}

                {history.length > 0 && !validated && (
                    <Pressable onPress={retourArriere} style={styles.undoButton}>
                        <Text style={styles.undoText}>Retour en arrière</Text>
                    </Pressable>
                )}

                <Pressable
                    onPress={ouvrirIndices}
                    disabled={validated}
                    style={styles.solutionButton}
                >
                    <Text style={styles.solutionButtonText}>
                        {hintsRevealed === 0
                            ? "Voir un indice"
                            : hintsRevealed >= totalHints
                            ? "Voir les indices"
                            : "Voir mes indices"}
                    </Text>
                </Pressable>

                <Pressable
                    onPress={demanderNouvellePartie}
                    style={styles.newGameButton}
                >
                    <Text style={styles.newGameText}>Nouvelle partie</Text>
                </Pressable>
            </ScrollView>

            <Modal
                visible={confirmVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setConfirmVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Nouvelle partie</Text>
                        <Text style={styles.modalText}>
                            Voulez-vous vraiment recommencer ? La partie en cours sera perdue.
                        </Text>

                        <View style={styles.modalActions}>
                            <Pressable
                                onPress={() => setConfirmVisible(false)}
                                style={[styles.modalButton, styles.modalCancel]}
                            >
                                <Text style={styles.modalCancelText}>Annuler</Text>
                            </Pressable>

                            <Pressable
                                onPress={confirmerNouvellePartie}
                                style={[styles.modalButton, styles.modalConfirm]}
                            >
                                <Text style={styles.modalConfirmText}>Confirmer</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={solutionVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setSolutionVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <ScrollView
                        style={styles.solutionModalScroll}
                        contentContainerStyle={styles.solutionModalContent}
                        showsVerticalScrollIndicator
                    >
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>
                                {hintsRevealed >= totalHints
                                    ? "Solution complète"
                                    : "Indice"}
                            </Text>

                            {revealedHints.map((ligne, index) => (
                                    <Text key={index} style={styles.solutionLine}>
                                        <Text style={styles.solutionIndiceLabel}>
                                            Indice {index + 1} :{" "}
                                        </Text>
                                        {ligne}
                                    </Text>
                                ))}

                            {hintRequestError && (
                                <Text style={styles.modalText}>
                                    {hintRequestError}
                                </Text>
                            )}

                            {hintsRevealed >= totalHints && (
                                <Text style={styles.solutionFinal}>
                                    Résultat : {game.target}
                                </Text>
                            )}

                            <View style={styles.modalActions}>
                                <Pressable
                                    onPress={() => setSolutionVisible(false)}
                                    style={[styles.modalButton, styles.modalCancel]}
                                >
                                    <Text style={styles.modalCancelText}>Fermer</Text>
                                </Pressable>

                                {hintsRevealed < totalHints && (
                                    <Pressable
                                        onPress={indiceSuivant}
                                        disabled={isRevealingHint}
                                        style={[styles.modalButton, styles.modalConfirm]}
                                    >
                                        <Text style={styles.modalConfirmText}>
                                            Indice suivant
                                        </Text>
                                    </Pressable>
                                )}
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}