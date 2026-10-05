export type Player = {
    id: string;
    socketId: string;
    pseudo: string;
};

export type Submission = {
    playerId: string;
    value: number;
    expression: string[];
    elapsedMs: number;
    diff: number;
};

export type MatchState = {
    matchId: string;
    players: Player[];
    numbers: number[];
    target: number;
    timeLimitMs: number;
    startAt: number;
    submissions: Map<string, Submission>;
    timeout: ReturnType<typeof setTimeout> | null;

    // Timer de reconnexion après une déconnexion
    disconnectTimeout: ReturnType<typeof setTimeout> | null;

    // Joueur actuellement déconnecté
    disconnectedPlayerId: string | null;

    finished: boolean;
};

export type MatchResultPayload = {
    matchId: string;
    winnerId: string | null;
    reason:
        | "both_submitted"
        | "time_up"
        | "opponent_left"
        | "opponent_disconnected"
        | "target_found";

    players: {
        id: string;
        pseudo: string;
        value: number | null;
        diff: number | null;
        elapsedMs: number | null;
    }[];
};

export type LeaderboardEntry = {
    id: string;
    pseudo: string;
    wins: number;
    losses: number;
    draws: number;
    points: number;
};

export interface ClientToServerEvents {
    "player:register": (payload: {
        id: string;
        pseudo: string;
    }) => void;

    "queue:join": () => void;
    "queue:leave": () => void;

    "match:answer": (payload: {
        matchId: string;
        value: number;
        expression: string[];
    }) => void;

    "match:leave": (matchId: string) => void;

    "leaderboard:get": () => void;

    "solo:score": (payload: { points: number }) => void;

    // ClientToServerEvents
    "invite:create": () => void;
    "invite:accept": (inviteId: string) => void;
}

export interface ServerToClientEvents {
    "player:registered": (payload: {
        id: string;
        pseudo: string;
        reconnected: boolean;
    }) => void;

    "player:error": (payload: {
        code: string;
        message: string;
    }) => void;

    "queue:waiting": () => void;

    "match:found": (payload: {
        matchId: string;
        opponent: {
            id: string;
            pseudo: string;
        };
        numbers: number[];
        target: number;
        timeLimitMs: number;
        startAt: number;
    }) => void;

    "match:opponentAnswered": () => void;

    "match:opponentDisconnected": (payload: {
        matchId: string;
        timeoutMs: number;
    }) => void;

    "match:opponentReconnected": (matchId: string) => void;

    "match:result": (payload: MatchResultPayload) => void;

    "match:opponentLeft": (matchId: string) => void;

    "leaderboard:top": (payload: {
        players: LeaderboardEntry[];
    }) => void;

    "solo:score-recorded": (payload: { points: number }) => void;
    "solo:score-error": (payload: { message: string }) => void;

    "server:maintenance": (payload: { message: string }) => void;

    // ServerToClientEvents
    "invite:created": (payload: { inviteId: string }) => void;
    "invite:error": (payload: { message: string }) => void;
}