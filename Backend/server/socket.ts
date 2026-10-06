import { Server, Socket } from "socket.io";
import { Matchmaking } from "./matchmaking";
import { GameSessionManager } from "./session";
import { registerOrGetPlayer } from "./player";
import { getTopPlayers } from "./leaderboard";
import { validatePseudo } from "./validation";
import { isRateLimited } from "./rateLimiter";
import { createGameInvite, getAndValidateInvite } from "./invite"; // <-- Importe tes fonctions d'invitation
import {
    createSoloChallenge,
    revealSoloHint,
    submitSoloChallenge,
} from "./soloChallenge";
import {
    ClientToServerEvents,
    ServerToClientEvents,
    Player,
} from "./types";

export const setupSocketServer = (
    io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
    const matchmaking = new Matchmaking();
    const sessions = new GameSessionManager(io);

    const socketToPlayer = new Map<string, Player>();

    io.on(
        "connection",
        (
            socket: Socket<
                ClientToServerEvents,
                ServerToClientEvents
            >
        ) => {
            socket.on("player:register", async ({ id, pseudo, deviceCredential }) => {
                if (isRateLimited(`register:${socket.id}`, 5, 10_000)) {
                    socket.emit("player:error", {
                        code: "rate_limited",
                        message: "Trop de tentatives, réessaie dans quelques secondes.",
                    });
                    return;
                }

                if (!/^[a-f0-9]{64}$/i.test(deviceCredential)) {
                    socket.emit("player:error", {
                        code: "device_credential_invalid",
                        message: "Identifiant sécurisé invalide.",
                    });
                    return;
                }

                const validationError = validatePseudo(pseudo);

                if (validationError) {
                    socket.emit("player:error", {
                        code: "invalid_pseudo",
                        message: validationError,
                    });
                    return;
                }

                try {
                    const player = await registerOrGetPlayer(
                        id,
                        pseudo.trim(),
                        deviceCredential
                    );
                    const existingMatch =
                        sessions.getMatchForPlayer(
                            player.id
                        );

                    const reconnected =
                        existingMatch !== null &&
                        existingMatch.disconnectedPlayerId ===
                            player.id;

                    const playerData: Player = {
                        id: player.id,
                        socketId: socket.id,
                        pseudo: player.pseudo,
                    };

                    socketToPlayer.set(
                        socket.id,
                        playerData
                    );

                    // 🔄 Si le joueur revient dans une partie
                    if (reconnected) {
                        sessions.playerReconnected(
                            player.id,
                            socket.id
                        );

                        socket.emit(
                            "player:registered",
                            {
                                id: player.id,
                                pseudo: player.pseudo,
                                reconnected: true,
                            }
                        );

                        return;
                    }

                    socket.emit(
                        "player:registered",
                        {
                            id: player.id,
                            pseudo: player.pseudo,
                            reconnected: false,
                        }
                    );
                } catch (err) {
                    const knownCodes = [
                        "pseudo_taken",
                        "device_credential_invalid",
                        "device_credential_in_use",
                    ];
                    const code = err instanceof Error && knownCodes.includes(err.message)
                        ? err.message
                        : "unknown";

                    socket.emit(
                        "player:error",
                        {
                            code,
                            message:
                                code === "pseudo_taken"
                                    ? "Ce pseudo est déjà pris."
                                    : code === "device_credential_invalid"
                                        ? "Ce profil est déjà lié à un autre appareil."
                                        : code === "device_credential_in_use"
                                            ? "Cet appareil utilise déjà un autre profil."
                                            : "Erreur d'inscription.",
                        }
                    );
                }
            });

            socket.on("queue:join", () => {
                if (isRateLimited(`queue:${socket.id}`, 10, 10_000)) {
                    return; // silencieux, pas besoin de feedback pour ça
                }
                const player =
                    socketToPlayer.get(socket.id);

                if (!player) {
                    socket.emit(
                        "player:error",
                        {
                            code: "not_registered",
                            message:
                                "Enregistre-toi avant de jouer.",
                        }
                    );

                    return;
                }

                // Ne pas remettre dans la queue
                // un joueur qui possède déjà une partie
                const existingMatch =
                    sessions.getMatchForPlayer(
                        player.id
                    );

                if (existingMatch) {
                    return;
                }

                const opponent =
                    matchmaking.join(player);

                if (opponent) {
                    sessions.createMatch(
                        opponent,
                        player
                    );
                } else {
                    socket.emit(
                        "queue:waiting"
                    );
                }
            });

            socket.on("queue:leave", () => {
                matchmaking.leave(socket.id);
            });

            // // ==========================================
            // // 👥 GESTION DES INVITATIONS AMIS (DEEP LINKS)
            // // ==========================================
            // socket.on("invite:create", async () => {
            //     const player = socketToPlayer.get(socket.id);
            //     if (!player) return;

            //     try {
            //         const invite = await createGameInvite(player.id);
                    
            //         // On envoie uniquement l'ID, le front gérera le format de l'URL
            //         socket.emit("invite:created", { inviteId: invite.id });
            //     } catch (err) {
            //         socket.emit("invite:error", { message: "Erreur lors de la création de l'invitation." });
            //     }
            // });

            // socket.on("invite:accept", async (inviteId) => {
            //     const player = socketToPlayer.get(socket.id);
            //     if (!player) {
            //         socket.emit("player:error", { code: "not_registered", message: "Enregistre-toi avant de rejoindre une partie." });
            //         return;
            //     }

            //     const result = await getAndValidateInvite(inviteId);
            //     if ("error" in result) {
            //         socket.emit("invite:error", { message: `Invitation invalide ou expirée (${result.error}).` });
            //         return;
            //     }

            //     const { invite } = result;
            //     if (invite.playerId === player.id) {
            //         socket.emit("invite:error", { message: "Tu ne peux pas t'inviter toi-même." });
            //         return;
            //     }

            //     // Récupérer le joueur hôte s'il est connecté
            //     const hostPlayer = Array.from(socketToPlayer.values()).find(p => p.id === invite.playerId);
            //     if (!hostPlayer) {
            //         socket.emit("invite:error", { message: "L'hôte de la partie est déconnecté." });
            //         return;
            //     }

            //     // Lancer la partie directement entre les deux joueurs
            //     sessions.createMatch(hostPlayer, player);
            // });

            socket.on("solo:challenge:start", async () => {
                const player = socketToPlayer.get(socket.id);
                if (!player) {
                    socket.emit("solo:error", {
                        code: "not_registered",
                        message: "Enregistre-toi avant de jouer.",
                        retryable: true,
                    });
                    return;
                }

                if (isRateLimited(`solo-start:${player.id}`, 10, 60_000)) {
                    socket.emit("solo:error", {
                        code: "rate_limited",
                        message: "Trop de parties lancées, réessaie plus tard.",
                        retryable: true,
                    });
                    return;
                }

                try {
                    const challenge = await createSoloChallenge(player.id);
                    socket.emit("solo:challenge", challenge);
                } catch (err) {
                    console.error("Erreur création défi solo:", err);
                    socket.emit("solo:error", {
                        code: "challenge_start_failed",
                        message: "Impossible de démarrer une partie classée.",
                        retryable: true,
                    });
                }
            });

            socket.on("solo:hint", async ({ challengeId, hintIndex }) => {
                const player = socketToPlayer.get(socket.id);
                if (!player) {
                    socket.emit("solo:error", {
                        challengeId,
                        code: "not_registered",
                        message: "Enregistre-toi avant de demander un indice.",
                        retryable: true,
                    });
                    return;
                }

                if (isRateLimited(`solo-hint:${player.id}`, 30, 60_000)) {
                    socket.emit("solo:error", {
                        challengeId,
                        code: "rate_limited",
                        message: "Trop d’indices demandés.",
                        retryable: true,
                    });
                    return;
                }

                try {
                    const hint = await revealSoloHint(challengeId, player.id, hintIndex);
                    socket.emit("solo:hint-revealed", { challengeId, ...hint });
                } catch (err) {
                    console.error("Erreur révélation indice solo:", err);
                    const code = err instanceof Error ? err.message : "hint_failed";
                    const retryable = ![
                        "challenge_unavailable",
                        "invalid_hint_index",
                        "hint_out_of_order",
                        "hint_unavailable",
                    ].includes(code);
                    socket.emit("solo:error", {
                        challengeId,
                        code,
                        message: "Impossible de valider cet indice.",
                        retryable,
                    });
                }
            });

            socket.on("solo:submit", async ({ challengeId, operations, hintsUsed }) => {
                const player = socketToPlayer.get(socket.id);
                if (!player) {
                    socket.emit("solo:error", {
                        challengeId,
                        code: "not_registered",
                        message: "Enregistre-toi avant de sauvegarder ton score.",
                        retryable: true,
                    });
                    return;
                }

                if (isRateLimited(`solo-submit:${player.id}`, 20, 60_000)) {
                    socket.emit("solo:error", {
                        challengeId,
                        code: "rate_limited",
                        message: "Trop de scores envoyés, réessaie plus tard.",
                        retryable: true,
                    });
                    return;
                }

                try {
                    const points = await submitSoloChallenge(
                        challengeId,
                        player.id,
                        operations,
                        hintsUsed
                    );
                    socket.emit("solo:score-recorded", { challengeId, points });
                } catch (err) {
                    console.error("Erreur validation score solo:", err);
                    const code = err instanceof Error ? err.message : "submit_failed";
                    const retryable = ![
                        "challenge_not_found",
                        "challenge_expired",
                        "invalid_hint_count",
                        "invalid_solution",
                        "challenge_unavailable",
                    ].includes(code);
                    socket.emit("solo:error", {
                        challengeId,
                        code,
                        message: "La solution ou le défi n’est pas valide.",
                        retryable,
                    });
                }
            });

            socket.on(
                "match:answer",
                ({
                    matchId,
                    value,
                    expression,
                }) => {
                    const player =
                        socketToPlayer.get(
                            socket.id
                        );

                    if (!player) return;

                    sessions.submitAnswer(
                        matchId,
                        player.id,
                        value,
                        expression
                    );
                }
            );

            // 🚪 Abandon volontaire
            socket.on(
                "match:leave",
                () => {
                    sessions.playerLeft(
                        socket.id
                    );
                }
            );

            socket.on(
                "leaderboard:get",
                async () => {
                    const players =
                        await getTopPlayers();

                    socket.emit(
                        "leaderboard:top",
                        { players }
                    );
                }
            );

            // 🔌 Déconnexion réseau
            socket.on("disconnect", () => {
                matchmaking.leave(
                    socket.id
                );

                // IMPORTANT :
                // on ne termine plus directement la partie.
                sessions.playerDisconnected(
                    socket.id
                );

                socketToPlayer.delete(
                    socket.id
                );
            });
        }
    );
};