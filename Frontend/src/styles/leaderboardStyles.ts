import { StyleSheet, Platform } from "react-native";

export const lbStyles = StyleSheet.create({
    leaderboardContainer: {
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 10,
    },

        leaderboardHeader: {
        alignItems: "center",
        marginBottom: 12,
        position: "relative",
    },

    backButton: {
        position: "absolute",
        left: 0,
        top: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1E293B",
        borderWidth: 1.5,
        borderColor: "#334155",
        zIndex: 10,
    },

    leaderboardTitleContainer: {
        alignItems: "center",
        justifyContent: "center",
    },

    leaderboardTitle: {
        fontSize: 24,
        fontWeight: "900",
        color: "#F8FAFC",
        letterSpacing: 0.3,
        textAlign: "center",
    },

    leaderboardSubtitle: {
        fontSize: 13,
        fontWeight: "600",
        color: "#94A3B8",
        marginTop: 2,
        textAlign: "center",
    }, 

    leaderboardList: {
        paddingBottom: 24,
    },

    leaderboardRow: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 72,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 10,
        borderRadius: 16,
        backgroundColor: "#111C33",
        borderWidth: 1,
        borderColor: "#1E293B",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
            },
            android: { elevation: 2 },
        }),
    },

    leaderboardTopRow: {
        backgroundColor: "#1E1B4B",
        borderWidth: 1.5,
        borderColor: "#FBBF24",
        ...Platform.select({
            ios: {
                shadowColor: "#FBBF24",
                shadowOpacity: 0.25,
                shadowRadius: 10,
            },
            android: { elevation: 4 },
        }),
    },

    leaderboardRank: {
        width: 44,
        alignItems: "center",
        justifyContent: "center",
    },

    leaderboardRankText: {
        fontSize: 15,
        fontWeight: "800",
        color: "#64748B",
    },

    leaderboardMedalText: {
        fontSize: 26,
    },

    leaderboardPlayer: {
        flex: 1,
        minWidth: 0,
        paddingHorizontal: 10,
    },

    leaderboardPseudo: {
        fontSize: 16,
        fontWeight: "800",
        color: "#F1F5F9",
    },

    leaderboardStats: {
        fontSize: 12,
        fontWeight: "600",
        color: "#94A3B8",
        marginTop: 4,
    },

    leaderboardRate: {
        width: 60,
        alignItems: "flex-end",
        justifyContent: "center",
    },

    leaderboardRateValue: {
        fontSize: 17,
        fontWeight: "900",
        color: "#4ADE80",
    },

    leaderboardRateLabel: {
        fontSize: 8,
        fontWeight: "800",
        color: "#475569",
        marginTop: 2,
        letterSpacing: 0.5,
    },

    leaderboardLoading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 80,
    },

    leaderboardLoadingText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: "600",
        color: "#94A3B8",
    },

    leaderboardError: {
        fontSize: 15,
        fontWeight: "700",
        color: "#F87171",
        textAlign: "center",
        marginBottom: 16,
    },

    leaderboardRetryButton: {
        paddingHorizontal: 24,
        paddingVertical: 13,
        borderRadius: 14,
        backgroundColor: "#2563EB",
        borderWidth: 1,
        borderColor: "#3B82F6",
    },

    leaderboardRetryText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "800",
    },

    leaderboardMeRow: {
        borderWidth: 1.5,
        borderColor: "#6366F1",
    },

    leaderboardPseudoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    meBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: "#6366F1",
    },

    meBadgeText: {
        fontSize: 9,
        fontWeight: "800",
        color: "#FFFFFF",
        letterSpacing: 0.4,
    },
});