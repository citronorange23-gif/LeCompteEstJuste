import { StyleSheet, Platform } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0B1220",
    },

    content: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: "center",
        gap: 16,
    },

    header: {
        alignItems: "center",
        marginBottom: 24,
    },

    title: {
        color: "#F8FAFC",
        fontSize: 28,
        fontWeight: "900",
        letterSpacing: 0.3,
        textAlign: "center",
    },

    subtitle: {
        color: "#94A3B8",
        fontSize: 14,
        marginTop: 6,
        textAlign: "center",
    },

    modeCard: {
        borderRadius: 18,
        padding: 20,
        borderWidth: 1.5,
        ...Platform.select({
            ios: {
                shadowOpacity: 0.3,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
            },
            android: { elevation: 5 },
        }),
    },

    soloCard: {
        backgroundColor: "#111C33",
        borderColor: "#334155",
        ...Platform.select({
            ios: { shadowColor: "#2563EB" },
        }),
    },

    multiplayerCard: {
        backgroundColor: "#1E1B4B",
        borderColor: "#6366F1",
        ...Platform.select({
            ios: { shadowColor: "#6366F1" },
        }),
    },

    modeIcon: {
        fontSize: 32,
        marginBottom: 8,
    },

    modeTitle: {
        color: "#F8FAFC",
        fontSize: 20,
        fontWeight: "800",
        marginBottom: 4,
    },

    modeDescription: {
        color: "#94A3B8",
        fontSize: 13,
        lineHeight: 18,
    },

    leaderboardLink: {
        marginTop: 12,
        alignItems: "center",
        paddingVertical: 10,
    },

    leaderboardLinkText: {
        color: "#A5B4FC",
        fontSize: 14,
        fontWeight: "700",
    },
});