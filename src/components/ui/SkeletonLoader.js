/**
 * SkeletonLoader — animated shimmer placeholder
 * Usage: <SkeletonLoader width={200} height={20} radius={8} />
 */
import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export const SkeletonLoader = ({
    width = "100%",
    height = 16,
    radius = 8,
    style,
}) => {
    const { theme } = useTheme();
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, {
                    toValue: 1,
                    duration: 900,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmer, {
                    toValue: 0,
                    duration: 900,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [shimmer]);

    const opacity = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [0.35, 0.7],
    });

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius: radius,
                    backgroundColor: theme.surfaceAlt || "#E5E7EB",
                    opacity,
                },
                style,
            ]}
        />
    );
};

export const CardSkeleton = () => {
    return (
        <View style={cardSkeletonStyles.card}>
            <SkeletonLoader width="100%" height={160} radius={16} />
            <View style={cardSkeletonStyles.body}>
                <SkeletonLoader width="70%" height={16} radius={6} style={{ marginBottom: 8 }} />
                <SkeletonLoader width="45%" height={12} radius={6} style={{ marginBottom: 12 }} />
                <View style={cardSkeletonStyles.row}>
                    <SkeletonLoader width={60} height={22} radius={11} />
                    <SkeletonLoader width={60} height={22} radius={11} />
                </View>
            </View>
        </View>
    );
};

const cardSkeletonStyles = StyleSheet.create({
    card: {
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 16,
    },
    body: {
        padding: 12,
    },
    row: {
        flexDirection: "row",
        gap: 8,
    },
});
