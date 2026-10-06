import { io, Socket } from "socket.io-client";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        socket = io(SERVER_URL, {
            autoConnect: false,
            transports: ["websocket"],
            timeout: 15_000,
            reconnection: true,
            reconnectionDelay: 1_000,
            reconnectionDelayMax: 5_000,
        });
    }
    return socket;
};