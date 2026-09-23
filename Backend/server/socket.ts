import { Server, Socket } from "socket.io";
import { Matchmaking } from "./matchmaking";
import { GameSessionManager } from "./session";
import { registerOrGetPlayer } from "./player";
import { getTopPlayers } from "./leaderboard";
import { validatePseudo } from "./validation";
import { isRateLimited } from "./rateLimiter";
import { createGameInvite, getAndValidateInvite } from "./invite"; // <-- Importe tes fonctions d'invitation
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
            socket.on("player:register", async ({ id, pseudo }) => {
                if (isRateLimited(`register:${socket.id}`, 5, 10_000)) {
                    socket.emit("player:error", {
                        code: "rate_limited",
                        message: "Trop de tentatives, réessaie dans quelques secondes.",
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
                    const player = await registerOrGetPlayer(id, pseudo.trim());
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
                    const code =
                        err instanceof Error &&
                        err.message ===
                            "pseudo_taken"
                            ? "pseudo_taken"
                            : "unknown";

                    socket.emit(
                        "player:error",
                        {
                            code,
                            message:
                                code ===
                                "pseudo_taken"
                                    ? "Ce pseudo est déjà pris."
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

            // ==========================================
            // 👥 GESTION DES INVITATIONS AMIS (DEEP LINKS)
            // ==========================================
            socket.on("invite:create", async () => {
                const player = socketToPlayer.get(socket.id);
                if (!player) return;

                try {
                    const invite = await createGameInvite(player.id);
                    
                    // On envoie uniquement l'ID, le front gérera le format de l'URL
                    socket.emit("invite:created", { inviteId: invite.id });
                } catch (err) {
                    socket.emit("invite:error", { message: "Erreur lors de la création de l'invitation." });
                }
            });

            socket.on("invite:accept", async (inviteId) => {
                const player = socketToPlayer.get(socket.id);
                if (!player) {
                    socket.emit("player:error", { code: "not_registered", message: "Enregistre-toi avant de rejoindre une partie." });
                    return;
                }

                const result = await getAndValidateInvite(inviteId);
                if ("error" in result) {
                    socket.emit("invite:error", { message: `Invitation invalide ou expirée (${result.error}).` });
                    return;
                }

                const { invite } = result;
                if (invite.playerId === player.id) {
                    socket.emit("invite:error", { message: "Tu ne peux pas t'inviter toi-même." });
                    return;
                }

                // Récupérer le joueur hôte s'il est connecté
                const hostPlayer = Array.from(socketToPlayer.values()).find(p => p.id === invite.playerId);
                if (!hostPlayer) {
                    socket.emit("invite:error", { message: "L'hôte de la partie est déconnecté." });
                    return;
                }

                // Lancer la partie directement entre les deux joueurs
                sessions.createMatch(hostPlayer, player);
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