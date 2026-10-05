import { useEffect, useRef, useState } from "react";
import {
    ScrollView,
    View,
    Text,
    Pressable,
    Modal,
    Platform,
} from "react-native";
import { styles } from "../styles/styles";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
    genererPartie,
    computeResult,
    computeScore,
    type Game,
} from "../lib/algorithm";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigationBar } from "expo-navigation-bar";
import { submitSoloScore } from "../lib/player";

type NumEntry = { id: number; value: number; used: boolean };

type HistoryEntry = {
    numbers: NumEntry[];
    steps: string[];
    nextId: number;
};

const applyHintPenalty = (
    baseScore: number,
    hintsUsed: number,
    totalHints: number
) => {
    if (totalHints <= 0) return baseScore;

    return Math.floor(
        baseScore * Math.max(0, totalHints - hintsUsed) / totalHints
    );
};

export default function Solo() {
    const router = useRouter();

    const [game, setGame] = useState<Game>(() => genererPartie());

    const [numbers, setNumbers] = useState<NumEntry[]>(() =>
        game.numbers.map((value, index) => ({ id: index, value, used: false }))
    );
    const [nextId, setNextId] = useState(game.numbers.length);

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [pendingOp, setPendingOp] = useState<string | null>(null);
    const [steps, setSteps] = useState<string[]>([]);
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    const [validated, setValidated] = useState(false);
    const [score, setScore] = useState<number | null>(null);
    const [meilleurEcart, setMeilleurEcart] = useState<number | null>(null);

    const [confirmVisible, setConfirmVisible] = useState(false);
    const [solutionVisible, setSolutionVisible] = useState(false);
    const [hintsRevealed, setHintsRevealed] = useState(0);
    const [scoreSaveStatus, setScoreSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const scoreSubmitted = useRef(false);

    useEffect(() => {
        if (Platform.OS === "android") {
            NavigationBar.setHidden(true);
            NavigationBar.setStyle("dark");
        }
    }, []);

    const nouvellePartie = () => {
        const nouvelleGame = genererPartie();

        setGame(nouvelleGame);
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
        setHistory([]);
        setValidated(false);
        setScore(null);
        setMeilleurEcart(null);
        setSolutionVisible(false);
        setHintsRevealed(0);
        setScoreSaveStatus("idle");
        scoreSubmitted.current = false;
    };

    const demanderNouvellePartie = () => {
        setSolutionVisible(false);

        if (validated) {
            nouvellePartie();
            return;
        }
        setConfirmVisible(true);
    };

    const confirmerNouvellePartie = () => {
        setConfirmVisible(false);
        nouvellePartie();
    };

    const ouvrirIndices = () => {
        if (validated) return;

        setSolutionVisible(true);

        if (hintsRevealed === 0) {
            setHintsRevealed(1);
        }
    };

    const indiceSuivant = () => {
        setHintsRevealed((prev) =>
            Math.min(prev + 1, game.solution.length)
        );
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

        setHistory((prev) => [...prev, { numbers, steps, nextId }]);

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

        if (resultat === game.target) {
            valider(nouvelleListe);
        }
    };

    const retourArriere = () => {
        if (history.length === 0 || validated) return;

        const dernierEtat = history[history.length - 1];

        setNumbers(dernierEtat.numbers);
        setSteps(dernierEtat.steps);
        setNextId(dernierEtat.nextId);
        setHistory((prev) => prev.slice(0, -1));
        setSelectedId(null);
        setPendingOp(null);
    };

    const selectOperation = (op: string) => {
        if (selectedId === null || validated) return;
        setPendingOp(op);
    };

    const sauvegarderScore = (points: number) => {
        setScoreSaveStatus("saving");
        submitSoloScore(points)
            .then(() => setScoreSaveStatus("saved"))
            .catch((error: unknown) => {
                console.error("Erreur sauvegarde score solo:", error);
                setScoreSaveStatus("error");
            });
    };

    const valider = (liste: NumEntry[] = numbers) => {
        if (validated || scoreSubmitted.current) return;

        setValidated(true);
        setSolutionVisible(false);

        const ecart = liste
            .filter((n) => !n.used)
            .reduce(
                (min, n) => Math.min(min, Math.abs(n.value - game.target)),
                Infinity
            );

        setMeilleurEcart(ecart);
        const baseScore = computeScore(ecart);
        const finalScore = applyHintPenalty(
            baseScore,
            hintsRevealed,
            game.solution.length
        );

        setScore(finalScore);
        scoreSubmitted.current = true;
        sauvegarderScore(finalScore);
    };

    const won = score === 10;

    const selectedValue =
        selectedId !== null
            ? numbers.find((n) => n.id === selectedId)?.value
            : null;

    const bestCurrentDifference = numbers
        .filter((n) => !n.used)
        .reduce(
            (best, n) => Math.min(best, Math.abs(n.value - game.target)),
            Infinity
        );
    const currentPotentialScore = applyHintPenalty(
        computeScore(bestCurrentDifference),
        hintsRevealed,
        game.solution.length
    );

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
                            won ? styles.winBanner : styles.loseBanner,
                        ]}
                    >
                        <Text style={styles.winText}>
                            {won
                                ? `Bravo, compte exact ! ${score} points`
                                : `Écart de ${meilleurEcart} — ${score} points`}
                        </Text>
                        <Text style={styles.subtitle}>
                            {scoreSaveStatus === "saving"
                                ? "Enregistrement au classement..."
                                : scoreSaveStatus === "saved"
                                    ? "Score ajouté au classement"
                                    : scoreSaveStatus === "error"
                                        ? "Score non enregistré au classement"
                                        : ""}
                        </Text>
                        {scoreSaveStatus === "error" && score !== null && (
                            <Pressable onPress={() => sauvegarderScore(score)}>
                                <Text style={styles.solutionButtonText}>
                                    Réessayer l’enregistrement
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
                    <Text style={styles.subtitle}>
                        Points encore possibles : {currentPotentialScore}
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
                            : hintsRevealed >= game.solution.length
                            ? "Voir les indices"
                            : "Voir mes indices"}
                    </Text>
                </Pressable>

                {!validated && (
                    <Pressable
                        onPress={() => valider()}
                        style={styles.newGameButton}
                    >
                        <Text style={styles.newGameText}>
                            Terminer et compter mon score
                        </Text>
                    </Pressable>
                )}

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
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>
                            {hintsRevealed >= game.solution.length
                                ? "Solution complète"
                                : "Indice"}
                        </Text>

                        <ScrollView style={styles.solutionScroll}>
                            {game.solution
                                .slice(0, hintsRevealed)
                                .map((ligne, index) => (
                                    <Text key={index} style={styles.solutionLine}>
                                        <Text style={styles.solutionIndiceLabel}>
                                            Indice {index + 1} :{" "}
                                        </Text>
                                        {ligne}
                                    </Text>
                                ))}

                            {hintsRevealed >= game.solution.length && (
                                <Text style={styles.solutionFinal}>
                                    Résultat : {game.target}
                                </Text>
                            )}
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <Pressable
                                onPress={() => setSolutionVisible(false)}
                                style={[styles.modalButton, styles.modalCancel]}
                            >
                                <Text style={styles.modalCancelText}>Fermer</Text>
                            </Pressable>

                            {hintsRevealed < game.solution.length && (
                                <Pressable
                                    onPress={indiceSuivant}
                                    style={[styles.modalButton, styles.modalConfirm]}
                                >
                                    <Text style={styles.modalConfirmText}>
                                        Indice suivant
                                    </Text>
                                </Pressable>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}