import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import * as Linking from "expo-linking";
import { getSocket } from "../lib/socket"; // 👈 On importe getSocket

import { resetLocalData } from "../lib/reset";

if (__DEV__) {
    // @ts-ignore
    global.resetLocalData = resetLocalData;
}

export default function RootLayout() {
    const router = useRouter();

    useEffect(() => {
        const handleDeepLink = (event: { url: string }) => {
            const parsed = Linking.parse(event.url);
            
            if (parsed.path === "invite" && parsed.queryParams?.id) {
                const inviteId = parsed.queryParams.id as string;
                
                // On récupère le socket et on émet l'événement
                const socket = getSocket();
                socket.emit("invite:accept", inviteId);
                
                router.push("/multiplayer");
            }
        };

        const subscription = Linking.addEventListener("url", handleDeepLink);

        Linking.getInitialURL().then((url) => {
            if (url) {
                handleDeepLink({ url });
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="solo" options={{ title: "Mode Solo" }} />
            <Stack.Screen name="multiplayer" options={{ title: "Multijoueur 1v1" }} />
            <Stack.Screen name="leaderboard" options={{ title: "Classement" }} />
        </Stack>
    );
}