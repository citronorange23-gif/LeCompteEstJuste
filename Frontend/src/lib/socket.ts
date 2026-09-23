import { io, Socket } from "socket.io-client";

const SERVER_URL = "http://10.0.0.35:3001";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        socket = io(SERVER_URL, {
            autoConnect: false,
            transports: ["websocket"],
        });
    }
    return socket;
};