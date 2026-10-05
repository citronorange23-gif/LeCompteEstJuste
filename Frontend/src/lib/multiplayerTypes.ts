export type MatchFoundPayload = {
    matchId: string;
    opponent: { id: string; pseudo: string };
    numbers: number[];
    target: number;
    solution: string[];
    timeLimitMs: number;
    startAt: number;
};

export type MatchResultPayload = {
    matchId: string;
    winnerId: string | null;
    reason:
        | "both_submitted"
        | "time_up"
        | "opponent_left"
        | "opponent_disconnected";
    players: {
        id: string;
        pseudo: string;
        value: number | null;
        diff: number | null;
        elapsedMs: number | null;
    }[];
};