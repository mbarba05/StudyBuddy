import { colors } from "@/assets/colors";
import supabase from "@/lib/subapase";
import { useAuth } from "@/services/auth/AuthProvider";
import React, { useEffect, useState } from "react";
import { Dimensions, ImageBackground, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

type MatchMakingCardProps = {
    name: string;
    major?: string | null; // string already coming from matchmaking.tsx
    year?: string | null;
    imageUrl?: string | null;
};

export default function MatchMakingCard({ name, major, year, imageUrl }: MatchMakingCardProps) {
    const { user } = useAuth();
    const [userMajor, setUserMajor] = useState<string | null>(null);

    // Fetch logged-in user's major from Supabase
    useEffect(() => {
        const loadUserMajor = async () => {
            if (!user?.id) return;

            const { data } = await supabase
                .from("profiles")
                .select("major:major_id(name)")
                .eq("user_id", user.id)
                .single();

            if (data?.major?.name) {
                setUserMajor(data.major.name);
            }
        };

        loadUserMajor();
    }, [user]);

    // compare lowercase so “Computer Science” matches “computer science”
    const isSameMajor = major && userMajor && major.trim().toLowerCase() === userMajor.trim().toLowerCase();

    return (
        <View style={styles.card}>
            <ImageBackground
                source={{
                    uri: imageUrl || "https://placehold.co/400x400?text=No+Image",
                }}
                style={styles.image}
                imageStyle={styles.imageStyle}
            >
                <View style={styles.overlay}>
                    <Text style={styles.name}>{name}</Text>

                    {/* Highlight if major matches user */}
                    {major ? (
                        <Text style={[styles.subText, isSameMajor ? styles.highlightMajor : null]}>{major}</Text>
                    ) : null}

                    {year ? <Text style={styles.subText}>{year}</Text> : null}
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: width * 0.95,
        height: height * 0.75,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#000",
        alignSelf: "center",
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
        marginTop: -35,
    },
    image: {
        flex: 1,
        justifyContent: "flex-end",
    },
    imageStyle: {
        resizeMode: "cover",
    },
    overlay: {
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        paddingHorizontal: 20,
        paddingVertical: 18,
    },
    name: {
        color: colors.text,
        fontSize: 26,
        fontWeight: "bold",
    },
    subText: {
        color: colors.textSecondary,
        fontSize: 17,
    },

    // Highlight matching major
    highlightMajor: {
        color: colors.accent,
        fontWeight: "bold",
        textShadowColor: "rgba(0,0,0,0.6)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
});
