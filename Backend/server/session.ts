import { Server } from "socket.io";
import { randomUUID } from "crypto";
import { genererPartie } from "@lcb/shared/algorithm";
import { recordMatchResult } from "./player";
import {
    MatchState,
    Player,
    Submission,
    ClientToServerEvents,
    ServerToClientEvents,
} from "./types";

const DEFAULT_TIME_LIMIT_MS = 150_000;
const DISCONNECT_GRACE_PERIOD_MS = 15_000;

export class GameSessionManager {
    private matches = new Map<string, MatchState>();

    private io: Server<
        ClientToServerEvents,
        ServerToClientEvents
    >;

    constructor(
        io: Server<ClientToServerEvents, ServerToClientEvents>
    ) {
        this.io = io;
    }

    createMatch(
        playerA: Player,
        playerB: Player,
        timeLimitMs: number = DEFAULT_TIME_LIMIT_MS
    ): MatchState {
        const partie = genererPartie();
        const matchId = randomUUID();

        const match: MatchState = {
            matchId,
            players: [playerA, playerB],
            numbers: partie.numbers,
            target: partie.target,
            timeLimitMs,
            startAt: Date.now(),
            submissions: new Map(),
            timeout: null,
            disconnectTimeout: null,
            disconnectedPlayerId: null,
            finished: false,
        };

        match.timeout = setTimeout(() => {
            this.finishMatch(matchId, "time_up");
        }, timeLimitMs);

        this.matches.set(matchId, match);

        for (const player of match.players) {
            const opponent = match.players.find(
                (p) => p.id !== player.id
            );

            if (!opponent) continue;

            this.io.to(player.socketId).emit("match:found", {
                matchId,
                opponent: {
                    id: opponent.id,
                    pseudo: opponent.pseudo,
                },
                numbers: match.numbers,
                target: match.target,
                timeLimitMs: match.timeLimitMs,
                startAt: match.startAt,
            });
        }

        return match;
    }

    submitAnswer(
        matchId: string,
        playerId: string,
        value: number,
        expression: string[]
    ) {
        const match = this.matches.get(matchId);

        if (!match || match.finished) return;

        // Un joueur déconnecté ne peut pas répondre
        if (match.disconnectedPlayerId === playerId) return;

        // Un joueur ne peut répondre qu'une fois
        if (match.submissions.has(playerId)) return;

        const submission: Submission = {
            playerId,
            value,
            expression,
            elapsedMs: Date.now() - match.startAt,
            diff: Math.abs(match.target - value),
        };

        match.submissions.set(playerId, submission);

        // 🎯 Premier à trouver la cible
        if (value === match.target) {
            this.finishMatch(matchId, "target_found");
            return;
        }

        // Prévenir l'adversaire
        const opponent = match.players.find(
            (p) => p.id !== playerId
        );

        if (opponent && !match.disconnectedPlayerId) {
            this.io
                .to(opponent.socketId)
                .emit("match:opponentAnswered");
        }

        if (
            match.submissions.size ===
            match.players.length
        ) {
            this.finishMatch(matchId, "both_submitted");
        }
    }

    /**
     * Déconnexion d'un socket.
     *
     * On NE termine PAS immédiatement la partie.
     * Le joueur a 15 secondes pour revenir.
     */
    playerDisconnected(socketId: string) {
    for (const match of this.matches.values()) {
        if (match.finished) continue;

        const disconnectedPlayer = match.players.find(
            (p) => p.socketId === socketId
        );

        if (!disconnectedPlayer) continue;

        const opponent = match.players.find(
            (p) => p.id !== disconnectedPlayer.id
        );

        if (opponent) {
            this.io.to(opponent.socketId).emit(
                "match:opponentDisconnected",
                {
                    matchId: match.matchId,
                    timeoutMs: 0,
                }
            );
        }

        this.finishMatch(
            match.matchId,
            "opponent_disconnected",
            disconnectedPlayer.id
        );

        return;
    }
}

    /**
     * Reconnexion d'un joueur.
     *
     * On retrouve son match avec son player.id,
     * puis on remplace l'ancien socketId.
     */
    playerReconnected(
        playerId: string,
        socketId: string
    ): MatchState | null {
        for (const match of this.matches.values()) {
            if (match.finished) continue;

            const player = match.players.find(
                (p) => p.id === playerId
            );

            if (!player) continue;

            // Aucun besoin de reconnexion
            if (
                match.disconnectedPlayerId !==
                playerId
            ) {
                return match;
            }

            // Nouveau socket
            player.socketId = socketId;

            // Annuler le timer de reconnexion
            if (match.disconnectTimeout) {
                clearTimeout(match.disconnectTimeout);
                match.disconnectTimeout = null;
            }

            match.disconnectedPlayerId = null;

            const opponent = match.players.find(
                (p) => p.id !== playerId
            );

            // Prévenir l'adversaire
            if (opponent) {
                this.io
                    .to(opponent.socketId)
                    .emit(
                        "match:opponentReconnected",
                        match.matchId
                    );
            }

            // Renvoyer l'état complet de la partie au joueur
            if (socketId) {
                this.io.to(socketId).emit("match:found", {
                    matchId: match.matchId,
                    opponent: opponent
                        ? {
                              id: opponent.id,
                              pseudo: opponent.pseudo,
                          }
                        : {
                              id: "",
                              pseudo: "Adversaire",
                          },
                    numbers: match.numbers,
                    target: match.target,
                    timeLimitMs: match.timeLimitMs,
                    startAt: match.startAt,
                });
            }

            return match;
        }

        return null;
    }

    /**
     * Abandon volontaire.
     *
     * Ici on termine immédiatement la partie.
     */
    playerLeft(socketId: string) {
        for (const match of this.matches.values()) {
            if (match.finished) continue;

            const leaving = match.players.find(
                (p) => p.socketId === socketId
            );

            if (!leaving) continue;

            const remaining = match.players.find(
                (p) => p.id !== leaving.id
            );

            if (remaining) {
                this.io
                    .to(remaining.socketId)
                    .emit(
                        "match:opponentLeft",
                        match.matchId
                    );
            }

            this.finishMatch(
                match.matchId,
                "opponent_left",
                leaving.id
            );

            return;
        }
    }

    getMatchForPlayer(playerId: string): MatchState | null {
        for (const match of this.matches.values()) {
            if (match.finished) continue;

            const player = match.players.find(
                (p) => p.id === playerId
            );

            if (player) {
                return match;
            }
        }

        return null;
    }

    private finishMatch(
        matchId: string,
        reason:
            | "both_submitted"
            | "time_up"
            | "opponent_left"
            | "opponent_disconnected"
            | "target_found",
        forfeitPlayerId?: string
    ) {
        const match = this.matches.get(matchId);

        if (!match || match.finished) return;

        match.finished = true;

        if (match.timeout) {
            clearTimeout(match.timeout);
            match.timeout = null;
        }

        if (match.disconnectTimeout) {
            clearTimeout(match.disconnectTimeout);
            match.disconnectTimeout = null;
        }

                let winnerId: string | null = null;
        let isDraw = false;

        // Défaite par abandon / déconnexion définitive
        if (
            (
                reason === "opponent_left" ||
                reason === "opponent_disconnected"
            ) &&
            forfeitPlayerId
        ) {
            const winner = match.players.find(
                (p) => p.id !== forfeitPlayerId
            );

            winnerId = winner
                ? winner.id
                : null;
        } else {
            const results = match.players.map((p) => ({
                id: p.id,
                submission:
                    match.submissions.get(p.id) ?? null,
            }));

            const ranked = results
                .filter(
                    (r) => r.submission !== null
                )
                .sort((a, b) => {
                    const diffA =
                        a.submission!.diff;
                    const diffB =
                        b.submission!.diff;

                    if (diffA !== diffB) {
                        return diffA - diffB;
                    }

                    return (
                        a.submission!.elapsedMs -
                        b.submission!.elapsedMs
                    );
                });

            if (ranked.length === 0) {
                // Personne n'a répondu : match nul
                isDraw = true;
                winnerId = null;
            } else if (
                ranked.length === 2 &&
                ranked[0].submission!.diff ===
                    ranked[1].submission!.diff
            ) {
                // Même écart à la cible : match nul
                isDraw = true;
                winnerId = null;
            } else {
                winnerId = ranked[0].id;
            }
        }

        const players = match.players.map((p) => {
            const submission =
                match.submissions.get(p.id);

            return {
                id: p.id,
                pseudo: p.pseudo,
                value: submission
                    ? submission.value
                    : null,
                diff: submission
                    ? submission.diff
                    : null,
                elapsedMs: submission
                    ? submission.elapsedMs
                    : null,
            };
        });

        for (const player of match.players) {
            this.io
                .to(player.socketId)
                .emit("match:result", {
                    matchId,
                    winnerId,
                    reason,
                    players,
                });
        }

                if (isDraw) {
            const [playerA, playerB] = match.players;
            recordMatchResult(
                playerA.id,
                playerB.id,
                true
            ).catch((err) => {
                console.error(
                    "Erreur mise à jour classement:",
                    err
                );
            });
        } else {
            const loser = match.players.find(
                (p) => p.id !== winnerId
            );

            recordMatchResult(
                winnerId,
                loser ? loser.id : null
            ).catch((err) => {
                console.error(
                    "Erreur mise à jour classement:",
                    err
                );
            });
        }

        this.matches.delete(matchId);
    }
}