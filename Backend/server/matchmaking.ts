import { Player } from "./types";

export class Matchmaking {
    private queue: Player[] = [];

    join(player: Player): Player | null {
        const opponent = this.queue.shift();
        if (opponent) return opponent;
        this.queue.push(player);
        return null;
    }

    leave(socketId: string) {
        this.queue = this.queue.filter((p) => p.socketId !== socketId);
    }
}