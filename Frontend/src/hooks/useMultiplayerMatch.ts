import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "../lib/socket";
import { ensurePlayerSocketRegistered } from "../lib/player";
import { getSavedPseudo, savePseudo } from "../lib/pseudo";
import NetInfo from "@react-native-community/netinfo";
import {
    MatchFoundPayload,
    MatchResultPayload,
} from "../lib/multiplayerTypes";

export type MultiplayerPhase =
    | "initializing"
    | "pseudo"
    | "identityError"
    | "connecting"
    | "menu"
    | "queue"
    | "match"
    | "result"
    | "disconnected";

export const useMultiplayerMatch = () => {
    const [phase, setPhase] =
        useState<MultiplayerPhase>("initializing");

    const [pseudoError, setPseudoError] =
        useState<string | null>(null);

    const [match, setMatch] =
        useState<MatchFoundPayload | null>(null);

    const [result, setResult] =
        useState<MatchResultPayload | null>(null);

    const [opponentAnswered, setOpponentAnswered] =
        useState(false);

    const [isConnected, setIsConnected] =
        useState(false);

    const socketRef = useRef(getSocket());

    const phaseRef =
        useRef<MultiplayerPhase>("connecting");

    const matchRef =
        useRef<MatchFoundPayload | null>(null);

    const pseudoRef =
        useRef<string | null>(null);

    const [isOffline, setIsOffline] = useState(false);


    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsOffline(state.isConnected === false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (phase !== "disconnected") return;

        const timeout = setTimeout(() => {
            setPhase("menu");
            setMatch(null);
        }, 20000);

        return () => clearTimeout(timeout);
    }, [phase]);

    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    useEffect(() => {
        matchRef.current = match;
    }, [match]);

    useEffect(() => {
        const socket = socketRef.current;

        const onConnect = () => {
            setIsConnected(true);
        };

        const onDisconnect = () => {
            setIsConnected(false);

            const currentPhase = phaseRef.current;

            if (
                currentPhase === "match" ||
                currentPhase === "connecting" ||
                currentPhase === "queue"
            ) {
                setPhase("disconnected");
            }
        };

        const onRegistered = ({
    pseudo,
}: {
    id: string;
    pseudo: string;
    reconnected: boolean;
}) => {
    setPseudoError(null);
    setIsConnected(true);

    pseudoRef.current = pseudo;

    setPhase("menu");
};

        const onError = ({ code, message }: { code: string; message: string }) => {
            if (code === "pseudo_taken" || code === "invalid_pseudo") {
                setPseudoError(message);
                setPhase("pseudo");
            } else if (code.startsWith("device_credential_")) {
                setPseudoError(message);
                setPhase("identityError");
            } else if (code === "not_registered") {
                setPhase("pseudo");
            }
        };

        const onWaiting = () => {
            setPhase("queue");
        };

        const onFound = (
            payload: MatchFoundPayload
        ) => {
            setMatch(payload);
            setResult(null);
            setOpponentAnswered(false);
            setPhase("match");
        };

        const onOpponentAnswered = () => {
            setOpponentAnswered(true);
        };

        const onOpponentDisconnected = () => {
            // Le serveur envoie immédiatement match:result.
        };

        const onResult = (
            payload: MatchResultPayload
        ) => {
            setResult(payload);
            setPhase("result");
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("player:registered", onRegistered);
        socket.on("player:error", onError);
        socket.on("queue:waiting", onWaiting);
        socket.on("match:found", onFound);
        socket.on(
            "match:opponentAnswered",
            onOpponentAnswered
        );
        socket.on(
            "match:opponentDisconnected",
            onOpponentDisconnected
        );
        socket.on("match:result", onResult);

        setIsConnected(socket.connected);

        // 🔥 Connexion automatique au démarrage
        const autoLogin = async () => {
            try {
                const savedPseudo = await getSavedPseudo();

if (!savedPseudo) {
    setPhase("pseudo");
    return;
}

pseudoRef.current = savedPseudo;

setPhase("connecting");
await ensurePlayerSocketRegistered();
            } catch (error) {
                console.error(
                    "Erreur connexion automatique:",
                    error
                );

                if (
                    error instanceof Error &&
                    "code" in error &&
                    typeof error.code === "string" &&
                    error.code.startsWith("device_credential_")
                ) {
                    setPseudoError(error.message);
                    setPhase("identityError");
                } else {
                    setPhase("pseudo");
                }
            }
        };

        autoLogin();

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off(
                "player:registered",
                onRegistered
            );
            socket.off("player:error", onError);
            socket.off("queue:waiting", onWaiting);
            socket.off("match:found", onFound);
            socket.off(
                "match:opponentAnswered",
                onOpponentAnswered
            );
            socket.off(
                "match:opponentDisconnected",
                onOpponentDisconnected
            );
            socket.off("match:result", onResult);
        };
    }, []);

    const register = useCallback(
        async (pseudo: string) => {
            const cleanPseudo = pseudo.trim();

            if (!cleanPseudo) {
                setPseudoError(
                    "Entre un pseudo."
                );
                return;
            }

            pseudoRef.current = cleanPseudo;

            // 💾 On garde le pseudo pour toujours
            // sur cet appareil.
            await savePseudo(cleanPseudo);

            setPseudoError(null);

            setPhase("connecting");
            try {
                await ensurePlayerSocketRegistered();
            } catch (error) {
                setPseudoError(
                    error instanceof Error ? error.message : "Inscription impossible."
                );
                setPhase(
                    error instanceof Error &&
                        "code" in error &&
                        typeof error.code === "string" &&
                        error.code.startsWith("device_credential_")
                        ? "identityError"
                        : "pseudo"
                );
            }
        },
        []
    );

    const submitAnswer = useCallback(
        (
            value: number,
            expression: string[]
        ) => {
            const currentMatch =
                matchRef.current;

            if (!currentMatch) return;
            if (!socketRef.current.connected) return;

            socketRef.current.emit(
                "match:answer",
                {
                    matchId:
                        currentMatch.matchId,
                    value,
                    expression,
                }
            );
        },
        []
    );

    const rejouer = useCallback(() => {
        const socket = socketRef.current;

        setMatch(null);
        setResult(null);
        setOpponentAnswered(false);

        if (!socket.connected) {
            socket.connect();
        }

        setPhase("queue");

        if (socket.connected) {
            socket.emit("queue:join");
        }
    }, []);

    const quitter = useCallback(() => {
        const socket = socketRef.current;
        const currentMatch = matchRef.current;

        if (currentMatch && socket.connected) {
            socket.emit(
                "match:leave",
                currentMatch.matchId
            );
        }

        socket.disconnect();

        setMatch(null);
        setResult(null);
        setOpponentAnswered(false);
        setIsConnected(false);

        // Le pseudo est sauvegardé.
        // On retourne donc au menu multijoueur.
        setPhase("menu");
    }, []);

    const annulerRecherche = useCallback(() => {
    const socket = socketRef.current;

    if (socket.connected) {
        socket.emit("queue:leave");
    }

    setMatch(null);
    setResult(null);
    setOpponentAnswered(false);

    // On retourne au menu multijoueur
    setPhase("menu");
}, []);

    return {
        phase,
        pseudoError,
        match,
        result,
        opponentAnswered,
        isConnected,
        register,
        submitAnswer,
        rejouer,
        quitter,
        annulerRecherche,
        isOffline
    };
};