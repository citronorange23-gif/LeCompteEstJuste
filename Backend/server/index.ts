import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupSocketServer } from "./socket";
import { ClientToServerEvents, ServerToClientEvents } from "./types";

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: "*" },
});

const gracefulShutdown = () => {
    io.emit("server:maintenance", {
        message: "Le serveur redémarre, reconnexion dans un instant...",
    });

    setTimeout(() => {
        process.exit(0);
    }, 2000); // laisse le temps au message de partir
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

setupSocketServer(io);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
httpServer.listen(PORT, () => {
    console.log(`Socket.io server running on port ${PORT}`);
});