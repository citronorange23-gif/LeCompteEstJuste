import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { hasCompletedPseudoSetup } from "../lib/pseudo";
import { watchPendingSoloScores } from "../lib/player";

export default function RootLayout() {
    const router = useRouter();
    const [ready, setReady] = useState(false);
    const [needsPseudo, setNeedsPseudo] = useState(false);

    useEffect(() => {
        hasCompletedPseudoSetup().then((done) => {
            setNeedsPseudo(!done);
            setReady(true);
        });
    }, []);

    useEffect(() => {
        if (ready && needsPseudo) {
            router.replace("/pseudo" as any);
        }
    }, [ready, needsPseudo]);

    useEffect(() => {
        if (!ready || needsPseudo) return;
        return watchPendingSoloScores();
    }, [ready, needsPseudo]);

    if (!ready) return null;

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
                name="pseudo"
                options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen name="solo" options={{ title: "Mode Solo" }} />
            <Stack.Screen name="multiplayer" options={{ title: "Multijoueur 1v1" }} />
            <Stack.Screen name="leaderboard" options={{ title: "Classement" }} />
        </Stack>
    );
}