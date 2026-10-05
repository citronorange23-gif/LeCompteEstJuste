import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getSavedPseudo } from "../lib/pseudo";
import { Ionicons } from "@expo/vector-icons";

import { getSocket } from "../lib/socket";
import { styles } from "../styles/styles";
import { lbStyles } from "../styles/leaderboardStyles";

type LeaderboardPlayer = {
    id: string;
    pseudo: string;
    wins: number;
    losses: number;
    draws: number;
    points: number;
};

export default function Leaderboard() {
    const router = useRouter();

    const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
    const [myPseudo, setMyPseudo] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getSavedPseudo().then(setMyPseudo);
    }, []);

    useEffect(() => {
        const socket = getSocket();

        const handleLeaderboard = ({
            players,
        }: {
            players: LeaderboardPlayer[];
        }) => {
            setPlayers(players);
            setLoading(false);
            setRefreshing(false);
            setError(null);
        };

        const handleConnect = () => {
            socket.emit("leaderboard:get");
        };

        const handleConnectError = () => {
            setLoading(false);
            setRefreshing(false);
            setError("Impossible de charger le classement.");
        };

        socket.on("leaderboard:top", handleLeaderboard);
        socket.on("connect", handleConnect);
        socket.on("connect_error", handleConnectError);

        if (socket.connected) {
            socket.emit("leaderboard:get");
        } else {
            socket.connect();
        }

        return () => {
            socket.off("leaderboard:top", handleLeaderboard);
            socket.off("connect", handleConnect);
            socket.off("connect_error", handleConnectError);
        };
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setError(null);

        const socket = getSocket();

        if (socket.connected) {
            socket.emit("leaderboard:get");
        } else {
            socket.connect();
        }
    }, []);

    const getMedal = (index: number) => {
        if (index === 0) return "🥇";
        if (index === 1) return "🥈";
        if (index === 2) return "🥉";

        return `#${index + 1}`;
    };

    const getWinRate = (player: LeaderboardPlayer) => {
        const total = player.wins + player.losses + player.draws;

        if (total === 0) return "0%";

        return `${Math.round((player.wins / total) * 100)}%`;
    };

    const renderPlayer = ({
        item,
        index,
    }: {
        item: LeaderboardPlayer;
        index: number;
    }) => {
        const isTopThree = index < 3;
        const total = item.wins + item.losses + item.draws;
        const isMe = myPseudo !== null && item.pseudo === myPseudo;

        const pointsStyle =
            item.points > 0
                ? lbStyles.leaderboardPointsPositive
                : item.points < 0
                    ? lbStyles.leaderboardPointsNegative
                    : lbStyles.leaderboardPointsZero;

        return (
            <View
                style={[
                    lbStyles.leaderboardRow,
                    isTopThree && lbStyles.leaderboardTopRow,
                    isMe && lbStyles.leaderboardMeRow,
                ]}
            >
                <View style={lbStyles.leaderboardRank}>
                    <Text
                        style={[
                            lbStyles.leaderboardRankText,
                            isTopThree && lbStyles.leaderboardMedalText,
                        ]}
                    >
                        {getMedal(index)}
                    </Text>
                </View>

                <View style={lbStyles.leaderboardPlayer}>
                    <View style={lbStyles.leaderboardPseudoRow}>
                        <Text
                            style={lbStyles.leaderboardPseudo}
                            numberOfLines={1}
                        >
                            {item.pseudo}
                        </Text>

                        {isMe && (
                            <View style={lbStyles.meBadge}>
                                <Text style={lbStyles.meBadgeText}>
                                    VOUS
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text style={lbStyles.leaderboardStats}>
                        {total === 0
                            ? "Aucune partie multijoueur"
                                : `${item.wins} victoire${
                                  item.wins !== 1 ? "s" : ""
                              } • ${item.losses} défaite${
                                  item.losses !== 1 ? "s" : ""
                              } • ${item.draws} nul${
                                  item.draws !== 1 ? "s" : ""
                              } • ${getWinRate(item)}`}
                    </Text>
                </View>

                <View style={lbStyles.leaderboardRate}>
                    <Text
                        style={[
                            lbStyles.leaderboardRateValue,
                            pointsStyle,
                        ]}
                    >
                        {item.points > 0
                            ? `+${item.points}`
                            : item.points}
                    </Text>

                    <Text style={lbStyles.leaderboardRateLabel}>
                        POINTS
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={lbStyles.leaderboardContainer}>
                <View style={lbStyles.leaderboardHeader}>
                    <View style={lbStyles.leaderboardTitleContainer}>
                        <Text style={lbStyles.leaderboardTitle}>
                            🏆 Classement
                        </Text>

                        <Text style={lbStyles.leaderboardSubtitle}>
                            {players.length > 0
                                ? `Top ${players.length}`
                                : "Top 50"}
                        </Text>
                    </View>

                    <Pressable
                        onPress={() => router.back()}
                        style={lbStyles.backButton}
                        hitSlop={8}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={18}
                            color="#FFFFFF"
                        />
                    </Pressable>
                </View>

                {loading ? (
                    <View style={lbStyles.leaderboardLoading}>
                        <ActivityIndicator
                            size="large"
                            color="#111827"
                        />

                        <Text style={lbStyles.leaderboardLoadingText}>
                            Chargement du classement...
                        </Text>
                    </View>
                ) : error ? (
                    <View style={lbStyles.leaderboardLoading}>
                        <Ionicons
                            name="cloud-offline-outline"
                            size={40}
                            color="#D1D5DB"
                            style={{ marginBottom: 12 }}
                        />

                        <Text style={lbStyles.leaderboardError}>
                            {error}
                        </Text>

                        <Pressable
                            onPress={onRefresh}
                            style={lbStyles.leaderboardRetryButton}
                        >
                            <Text
                                style={
                                    lbStyles.leaderboardRetryText
                                }
                            >
                                Réessayer
                            </Text>
                        </Pressable>
                    </View>
                ) : (
                    <FlatList
                        data={players}
                        keyExtractor={(item) => item.id}
                        renderItem={renderPlayer}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={
                            lbStyles.leaderboardList
                        }
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor="#111827"
                            />
                        }
                        ListEmptyComponent={
                            <View
                                style={
                                    lbStyles.leaderboardLoading
                                }
                            >
                                <Ionicons
                                    name="trophy-outline"
                                    size={40}
                                    color="#D1D5DB"
                                    style={{ marginBottom: 12 }}
                                />

                                <Text
                                    style={
                                        lbStyles.leaderboardLoadingText
                                    }
                                >
                                    Aucun joueur classé pour le
                                    moment.
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}