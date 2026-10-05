import { io, Socket } from "socket.io-client";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

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