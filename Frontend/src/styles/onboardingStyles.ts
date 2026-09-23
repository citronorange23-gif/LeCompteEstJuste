import { StyleSheet } from "react-native";

export const obStyles = StyleSheet.create({
    card: {
        maxHeight: "80%",
    },

    scroll: {
        maxHeight: 380,
        marginBottom: 18,
    },

    regleRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 18,
    },

    regleEmoji: {
        fontSize: 26,
        width: 34,
        textAlign: "center",
    },

    regleTexte: {
        flex: 1,
    },

    regleTitre: {
        color: "#F8FAFC",
        fontSize: 15,
        fontWeight: "800",
        marginBottom: 3,
    },

    regleDescription: {
        color: "#94A3B8",
        fontSize: 13,
        lineHeight: 18,
    },
});