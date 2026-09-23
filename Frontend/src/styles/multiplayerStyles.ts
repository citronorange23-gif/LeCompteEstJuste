import { StyleSheet, Platform } from "react-native";

export const mpStyles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
        gap: 14,
    },

    label: {
        color: "#94A3B8",
        fontSize: 13,
        textAlign: "center",
        marginBottom: 6,
    },

    pseudoInput: {
        width: "100%",
        height: 50,
        borderRadius: 12,
        backgroundColor: "#111C33",
        borderWidth: 1.5,
        borderColor: "#334155",
        paddingHorizontal: 16,
        color: "#F8FAFC",
        fontSize: 16,
        fontWeight: "600",
    },

    pseudoInputError: {
        borderColor: "#EF4444",
    },

    errorText: {
        color: "#F87171",
        fontSize: 12,
        marginTop: -4,
    },

    primaryButton: {
        width: "100%",
        height: 50,
        borderRadius: 12,
        backgroundColor: "#6366F1",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 4,
    },

    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },

    secondaryButton: {
        width: "100%",
        height: 46,
        borderRadius: 12,
        backgroundColor: "#1E293B",
        borderWidth: 1,
        borderColor: "#334155",
        alignItems: "center",
        justifyContent: "center",
    },

    secondaryButtonText: {
        color: "#E2E8F0",
        fontSize: 14,
        fontWeight: "700",
    },

    queueTitle: {
        color: "#F8FAFC",
        fontSize: 18,
        fontWeight: "800",
        marginTop: 12,
    },

    matchHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 4,
        marginBottom: 8,
    },

    opponentBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    opponentName: {
        color: "#A5B4FC",
        fontSize: 13,
        fontWeight: "700",
    },

    opponentAnsweredDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#22C55E",
    },

    timerBarTrack: {
        height: 8,
        borderRadius: 4,
        backgroundColor: "#1E293B",
        overflow: "hidden",
        marginBottom: 12,
    },

    timerBarFill: {
        height: "100%",
        backgroundColor: "#6366F1",
        borderRadius: 4,
    },

    timerBarFillLow: {
        backgroundColor: "#EF4444",
    },

    timerText: {
        color: "#94A3B8",
        fontSize: 12,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 10,
    },

    waitingBanner: {
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: "#1E1B4B",
        borderWidth: 1,
        borderColor: "#6366F1",
        alignItems: "center",
        marginTop: 12,
    },

    waitingBannerText: {
        color: "#C7D2FE",
        fontSize: 13,
        fontWeight: "700",
    },

    resultTitle: {
        color: "#F8FAFC",
        fontSize: 22,
        fontWeight: "900",
        textAlign: "center",
        marginBottom: 4,
    },

    playerResultCard: {
        width: "100%",
        borderRadius: 14,
        padding: 16,
        borderWidth: 1.5,
        marginBottom: 12,
        backgroundColor: "#111C33",
        borderColor: "#334155",
    },

    winnerCard: {
        backgroundColor: "#14532D",
        borderColor: "#22C55E",
        ...Platform.select({
            ios: {
                shadowColor: "#22C55E",
                shadowOpacity: 0.3,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 3 },
            },
            android: { elevation: 4 },
        }),
    },

    playerResultName: {
        color: "#F8FAFC",
        fontSize: 15,
        fontWeight: "800",
        marginBottom: 4,
    },

    playerResultDetail: {
        color: "#94A3B8",
        fontSize: 13,
    },

    // Bannière de résultat
    resultBanner: {
        width: "100%",
        paddingVertical: 24,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 2,
        backgroundColor: "#0F172A",
        alignItems: "center",
        marginBottom: 16,
    },
    resultEmoji: { fontSize: 48, marginBottom: 4 },
    resultBannerTitle: { fontSize: 26, fontWeight: "800", marginBottom: 4 },
    resultSubtitle: {
        fontSize: 14,
        color: "#94A3B8",
        textAlign: "center",
        paddingHorizontal: 8,
    },

    // Pastille cible
    targetPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1E293B",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        marginBottom: 20,
        gap: 10,
    },
    targetPillLabel: { color: "#94A3B8", fontSize: 12, fontWeight: "700", letterSpacing: 1 },
    targetPillValue: { color: "#F8FAFC", fontSize: 20, fontWeight: "800" },

    // Cartes joueurs
    playersRow: {
        flexDirection: "row",
        width: "100%",
        gap: 12,
        marginBottom: 12,
    },
    playerCard: {
        flex: 1,
        paddingVertical: 18,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: "#1E293B",
        borderWidth: 2,
        borderColor: "transparent",
        alignItems: "center",
    },
    playerCardSelf: { backgroundColor: "#1E1B4B" },
    playerCardWinner: {
        borderColor: "#FBBF24",
        backgroundColor: "#292524",
    },
    crownIcon: { fontSize: 22, marginBottom: 2 },
    playerCardRole: {
        fontSize: 11,
        color: "#94A3B8",
        fontWeight: "700",
        letterSpacing: 1,
        textTransform: "uppercase",
        marginBottom: 4,
    },
    playerCardName: {
        fontSize: 15,
        fontWeight: "700",
        color: "#F8FAFC",
        marginBottom: 8,
    },
    playerCardTime: {
        fontSize: 26,
        fontWeight: "800",
        color: "#10B981",
    },
    playerCardTimeFail: { color: "#64748B" },
    playerCardStatus: {
        fontSize: 12,
        color: "#94A3B8",
        marginTop: 4,
    },

    // Écart
    timeDiffText: {
        color: "#94A3B8",
        fontSize: 13,
        marginBottom: 20,
        fontStyle: "italic",
    },

    disconnectBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#F59E0B",
},

disconnectEmoji: {
    fontSize: 26,
    marginRight: 10,
},

disconnectContent: {
    flex: 1,
},

disconnectTitle: {
    color: "#92400E",
    fontSize: 15,
    fontWeight: "800",
},

disconnectText: {
    marginTop: 2,
    color: "#A16207",
    fontSize: 12,
    fontWeight: "600",
},

disconnectTimer: {
    marginTop: 3,
    color: "#B45309",
    fontSize: 13,
    fontWeight: "800",
},
});