import { StyleSheet, Platform } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0B1220", // bleu nuit profond
    },

    content: {
        flex: 1,
        paddingHorizontal: 18,
    },

    scrollContent: {
        paddingTop: 10,
        paddingBottom: 20,
    },

    header: {
        alignItems: "center",
        marginBottom: 12,
    },

    title: {
        color: "#F8FAFC",
        fontSize: 24,
        fontWeight: "800",
        letterSpacing: 0.3,
    },

    subtitle: {
        color: "#94A3B8",
        fontSize: 13,
        marginTop: 3,
    },

    // CIBLE — carte indigo pour bien la distinguer
    targetContainer: {
        alignItems: "center",
        alignSelf: "center",
        paddingHorizontal: 32,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: "#1E1B4B",
        borderWidth: 1.5,
        borderColor: "#6366F1",
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: "#6366F1",
                shadowOpacity: 0.35,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
            },
            android: { elevation: 6 },
        }),
    },

    targetLabel: {
        color: "#A5B4FC",
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 2.5,
    },

    target: {
        color: "#E0E7FF",
        fontSize: 50,
        fontWeight: "900",
        marginTop: 2,
        lineHeight: 56,
    },

    resultBanner: {
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginBottom: 12,
        alignItems: "center",
        borderWidth: 1,
    },

    scoreBanner: {
        backgroundColor: "#422006",
        borderColor: "#FBBF24",
    },

    resultText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 13,
        letterSpacing: 0.2,
    },

    numbersContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 10,
    },

    // Nombres — cartes claires (contraste fort avec le fond)
    numberCard: {
        width: 84,
        height: 62,
        borderRadius: 14,
        backgroundColor: "#F1F5F9",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#F1F5F9",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
            },
            android: { elevation: 2 },
        }),
    },

    selectedNumber: {
        backgroundColor: "#FBBF24",
        borderColor: "#FDE68A",
        ...Platform.select({
            ios: {
                shadowColor: "#FBBF24",
                shadowOpacity: 0.5,
                shadowRadius: 8,
            },
            android: { elevation: 5 },
        }),
    },

    usedNumber: {
        backgroundColor: "#1E293B",
        borderColor: "#1E293B",
        opacity: 0.55,
        ...Platform.select({
            ios: { shadowOpacity: 0 },
            android: { elevation: 0 },
        }),
    },

    number: {
        fontSize: 24,
        fontWeight: "900",
        color: "#0F172A",
    },

    selectedNumberText: {
        color: "#111827",
    },

    usedNumberText: {
        color: "#64748B",
    },

    operationContainer: {
        marginTop: 18,
    },

    sectionTitle: {
        color: "#94A3B8",
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 8,
        letterSpacing: 1.2,
        textTransform: "uppercase",
    },

    operations: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 8,
    },

    // Opérations — ardoise/indigo (différent des nombres)
    operationButton: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        backgroundColor: "#1E293B",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: "#334155",
    },

    selectedOperation: {
        backgroundColor: "#6366F1",
        borderColor: "#818CF8",
        ...Platform.select({
            ios: {
                shadowColor: "#6366F1",
                shadowOpacity: 0.5,
                shadowRadius: 8,
            },
            android: { elevation: 5 },
        }),
    },

    operationText: {
        color: "#E2E8F0",
        fontSize: 24,
        fontWeight: "800",
    },

    selectedOperationText: {
        color: "#FFFFFF",
    },

    calculation: {
        marginTop: 16,
        minHeight: 48,
        borderRadius: 12,
        backgroundColor: "#111C33",
        borderWidth: 1,
        borderColor: "#1E293B",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 14,
    },

    calculationText: {
        color: "#CBD5E1",
        fontSize: 15,
        fontWeight: "600",
    },

    stepsContainer: {
        marginTop: 14,
        gap: 4,
        paddingLeft: 4,
        borderLeftWidth: 2,
        borderLeftColor: "#1E293B",
    },

    stepText: {
        color: "#94A3B8",
        fontSize: 12,
        paddingLeft: 8,
    },

    undoButton: {
    marginTop: 14,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#78350F",
    borderWidth: 1,
    borderColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    ...Platform.select({
        ios: {
            shadowColor: "#F59E0B",
            shadowOpacity: 0.22,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
        },
        android: {
            elevation: 3,
        },
    }),
},

undoText: {
    color: "#FDE68A",
    fontSize: 14,
    fontWeight: "700",
},

solutionButton: {
    marginTop: 10,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#312E81",
    borderWidth: 1,
    borderColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
        ios: {
            shadowColor: "#6366F1",
            shadowOpacity: 0.25,
            shadowRadius: 7,
            shadowOffset: { width: 0, height: 3 },
        },
        android: {
            elevation: 3,
        },
    }),
},

solutionButtonText: {
    color: "#E0E7FF",
    fontSize: 14,
    fontWeight: "700",
},

newGameButton: {
    marginTop: 12,
    marginBottom: 14,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#15803D",
    borderWidth: 1,
    borderColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
        ios: {
            shadowColor: "#22C55E",
            shadowOpacity: 0.3,
            shadowRadius: 9,
            shadowOffset: { width: 0, height: 4 },
        },
        android: {
            elevation: 4,
        },
    }),
},

newGameText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
},

abandonButton: {
    marginTop: 12,
    marginBottom: 14,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#7F1D1D",
    borderWidth: 1,
    borderColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
        ios: {
            shadowColor: "#EF4444",
            shadowOpacity: 0.25,
            shadowRadius: 9,
            shadowOffset: { width: 0, height: 4 },
        },
        android: {
            elevation: 4,
        },
    }),
},

abandonText: {
    color: "#FEE2E2",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
},

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(2,6,23,0.78)",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 26,
    },

    modalCard: {
        width: "100%",
        backgroundColor: "#111C33",
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: "#334155",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.4,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 8 },
            },
            android: { elevation: 10 },
        }),
    },

    modalTitle: {
        color: "#F8FAFC",
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 6,
    },

    modalText: {
        color: "#94A3B8",
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 18,
    },

    modalActions: {
        flexDirection: "row",
        gap: 10,
    },

    modalButton: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },

    modalCancel: {
        backgroundColor: "#1E293B",
        borderWidth: 1,
        borderColor: "#334155",
    },

    modalCancelText: {
        color: "#E2E8F0",
        fontWeight: "700",
        fontSize: 14,
    },

    modalConfirm: {
        backgroundColor: "#16A34A",
    },

    modalConfirmText: {
        color: "#FFFFFF",
        fontWeight: "800",
        fontSize: 14,
    },


    solutionScroll: {
        maxHeight: 260,
        marginBottom: 18,
    },

    solutionLine: {
        color: "#CBD5E1",
        fontSize: 14,
        marginBottom: 7,
    },

    solutionFinal: {
        color: "#4ADE80",
        fontSize: 15,
        fontWeight: "800",
        marginTop: 6,
    },

    solutionCloseButton: {
        marginBottom: 0,
    },

    solutionIndiceLabel: {
        color: "#4ADE80",
        fontWeight: "800",
    },
});