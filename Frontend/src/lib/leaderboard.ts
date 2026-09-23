import { getSocket } from "./socket";

export type LeaderboardPlayer = {
    id: string;
    pseudo: string;
    wins: number;
    losses: number;
    draws: number;
    points: number;
};

export const getLeaderboard = (
    onResult: (players: LeaderboardPlayer[]) => void
) => {
    const socket = getSocket();

    const handleLeaderboard = ({
        players,
    }: {
        players: LeaderboardPlayer[];
    }) => {
        onResult(players);
    };

    socket.on("leaderboard:top", handleLeaderboard);

    if (!socket.connected) {
        socket.connect();
    }

    socket.emit("leaderboard:get");

    return () => {
        socket.off("leaderboard:top", handleLeaderboard);
    };
};