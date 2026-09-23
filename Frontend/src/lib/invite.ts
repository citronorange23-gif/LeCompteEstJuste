import { Share } from "react-native";
import * as Linking from "expo-linking";
import { getSocket } from "./socket";

export const handleInviteFriend = () => {
    const socket = getSocket();

    socket.emit("invite:create");

    socket.once("invite:created", async ({ inviteId }) => {
        try {
            // On force l'utilisation de ton scheme personnalisé ici
            const shareUrl = Linking.createURL("invite", {
                scheme: "lecompteestbon", // Remplace par ton scheme exact de app.json
                queryParams: { code: inviteId },
            });

            await Share.share({
                message: `Viens m'affronter sur Le Compte est Bon en 1v1 ! Rejoins ma partie ici : ${shareUrl}`,
            });
        } catch (error) {
            console.error("Erreur lors du partage de l'invitation :", error);
        }
    });
};