import { colors } from "@/assets/colors";
import supabase from "@/lib/supabase";
import { useAuth } from "@/services/auth/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect, useMemo, useState } from "react";
import { Dimensions, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width, height } = Dimensions.get("window");

type MatchMakingCardProps = {
    name: string;
    major?: string | null; // string already coming from matchmaking.tsx
    year?: string | null;
    bio?: string | null;
    imageUrls?: string[];
};

export default function MatchMakingCard({ name, major, year, bio, imageUrls = [] }: MatchMakingCardProps) {
    const { user } = useAuth();
    const [userMajor, setUserMajor] = useState<string | null>(null);
    const [photoIndex, setPhotoIndex] = useState(0);
    const [showBio, setShowBio] = useState(false);

    const [photoIndex, setPhotoIndex] = useState(0);
    const [showBio, setShowBio] = useState(false);
    const [showFullPhoto, setShowFullPhoto] = useState(false);

    const photos = useMemo(() => {
        const filtered = (imageUrls ?? []).filter((url): url is string => !!url && url.trim().length > 0);
        return filtered.length > 0 ? filtered : ["https://placehold.co/400x400?text=No+Image"];
    }, [imageUrls]);

    const currentPhoto = photos[photoIndex] ?? photos[0];

    const goPrevPhoto = (): void => {
        setPhotoIndex((prev) => (prev > 0 ? prev - 1 : prev));
    };

    const goNextPhoto = (): void => {
        setPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : prev));
    };

    // Fetch logged-in user's major from Supabase
    useEffect(() => {
        const loadUserMajor = async () => {
            if (!user?.id) return;

         const { data } = await supabase
                .from("profiles")
                .select("major:major_id!inner(name)")
                .eq("user_id", user.id)
                .single();

            if ((data as any)?.major?.name) {
                setUserMajor((data as any).major.name);
            }
        };

        loadUserMajor();
    }, [user]);

    const photos = useMemo(() => {
        const filtered = (imageUrls ?? []).filter((url): url is string => !!url && url.trim().length > 0);
        return filtered.length > 0 ? filtered : ["https://placehold.co/400x400?text=No+Image"];
    }, [imageUrls]);

    const currentPhoto = photos[photoIndex] ?? photos[0];
    const goPrevPhoto = () => {
        setPhotoIndex((prev) => (prev > 0 ? prev - 1 : prev));
    };
    const goNextPhoto = () => {
        setPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : prev));
    };
    // compare lowercase so “Computer Science” matches “computer science”
    const isSameMajor = major && userMajor && major.trim().toLowerCase() === userMajor.trim().toLowerCase();

    return (
        <>
            <View style={styles.card}>
                <Pressable style={styles.imageWrapper}>
                    <Image source={{ uri: currentPhoto }} style={styles.image} contentFit="cover" />

                    <View style={styles.tapZones}>
                        <Pressable style={styles.leftTapZone} onPress={goPrevPhoto} />
                        <Pressable style={styles.rightTapZone} onPress={goNextPhoto} />
                    </View>

                    {photos.length > 1 && (
                        <View style={styles.dotsContainer}>
                            {photos.map((_, index) => (
                                <View
                                    key={index}
                                    style={[styles.dot, index === photoIndex ? styles.activeDot : styles.inactiveDot]}
                                />
                            ))}
                        </View>
                    )}

                    <View style={styles.overlay}>
                        <View style={styles.textBlock}>
                            <Text style={styles.name}>{name}</Text>

                            {major ? (
                                <Text style={[styles.subText, isSameMajor ? styles.highlightMajor : null]}>
                                    {major}
                                </Text>
                            ) : null}

                            {year ? <Text style={styles.subText}>{year}</Text> : null}
                        </View>

                        <TouchableOpacity style={styles.bioButton} onPress={() => setShowBio(true)}>
                            <Ionicons name="chevron-up" size={22} color={colors.text} />
                            <Text style={styles.bioButtonText}>Bio</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.zoomButton} onPress={() => setShowFullPhoto(true)}>
                            <Ionicons name="expand-outline" size={20} color={colors.text} />
                            <Text style={styles.bioButtonText}>View Photo</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </View>

            <Modal visible={showBio} transparent animationType="slide" onRequestClose={() => setShowBio(false)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setShowBio(false)}>
                    <Pressable style={styles.bioSheet} onPress={() => {}}>
                        <View style={styles.bioHeader}>
                            <Text style={styles.bioTitle}>{name}</Text>
                            <TouchableOpacity onPress={() => setShowBio(false)}>
                                <Ionicons name="close" size={26} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.bioLabel}>Bio</Text>
                        <Text style={styles.bioText}>{bio?.trim() ? bio : "No bio added yet."}</Text>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                visible={showFullPhoto}
                transparent={false}
                animationType="fade"
                onRequestClose={() => setShowFullPhoto(false)}
            >
                <View style={styles.fullscreenModal}>
                    <Image source={{ uri: currentPhoto }} style={styles.fullscreenImage} contentFit="contain" />

                    <View style={styles.fullscreenTopBar}>
                        <Pressable style={styles.fullscreenCloseButton} onPress={() => setShowFullPhoto(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    card: {
        width: width * 0.95,
        height: height * 0.725,
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
        width: "100%",
        height: "100%",
    },
    imageStyle: {
        resizeMode: "cover",
    },
    tapZones: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: "row",
        zIndex: 1,
    },
    leftTapZone: {
        flex: 1,
    },
    rightTapZone: {
        flex: 1,
    },
    dotsContainer: {
        position: "absolute",
        top: 16,
        left: 16,
        right: 16,
        flexDirection: "row",
        gap: 6,
        zIndex: 2,
    },
    dot: {
        flex: 1,
        height: 4,
        borderRadius: 999,
    },
    activeDot: {
        backgroundColor: colors.accent,
    },
    inactiveDot: {
        backgroundColor: "rgba(255, 255, 255, 0.35)",
    },
    overlay: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        paddingHorizontal: 20,
        paddingVertical: 18,
        zIndex: 2,
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
    imageWrapper: {
        flex: 1,
    },
    tapZones: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: "row",
        zIndex: 1,
    },
    leftTapZone: {
        flex: 1,
    },
    rightTapZone: {
        flex: 1,
    },
    dotsContainer: {
        position: "absolute",
        top: 16,
        left: 16,
        right: 16,
        flexDirection: "row",
        gap: 6,
        zIndex: 2,
    },
    dot: {
        flex: 1,
        height: 4,
        borderRadius: 999,
    },
    activeDot: {
        backgroundColor: colors.accent,
    },
    inactiveDot: {
        backgroundColor: "rgba(255,255,255,0.35)",
    },
    textBlock: {
        marginBottom: 10,
    },
    bioButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 4,
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    bioButtonText: {
        color: colors.text,
        fontSize: 14,
        fontWeight: "600",
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    bioSheet: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        minHeight: height * 0.28,
    },
    bioHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    bioTitle: {
        color: colors.text,
        fontSize: 22,
        fontWeight: "bold",
    },
    bioLabel: {
        color: colors.textSecondary,
        fontSize: 15,
        marginBottom: 8,
    },
    bioText: {
        color: colors.text,
        fontSize: 16,
        lineHeight: 22,
    },
    fullscreenModal: {
        flex: 1,
        backgroundColor: colors.black,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 32,
    },
    fullscreenImage: {
        width: "100%",
        height: "80%",
    },
    fullscreenTopBar: {
        position: "absolute",
        top: 20,
        right: 20,
    },
    fullscreenCloseButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    zoomButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 4,
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        marginTop: 8,
    },

    // Highlight matching major
    highlightMajor: {
        color: colors.accent,
        fontWeight: "bold",
        textShadowColor: "rgba(0,0,0,0.6)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
    bioButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 4,
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    bioButtonText: {
        color: colors.text,
        fontSize: 14,
        fontWeight: "600",
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    bioSheet: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        minHeight: height * 0.28,
    },
    bioHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    bioTitle: {
        color: colors.text,
        fontSize: 22,
        fontWeight: "bold",
    },
    bioLabel: {
        color: colors.textSecondary,
        fontSize: 15,
        marginBottom: 8,
    },
    bioText: {
        color: colors.text,
        fontSize: 16,
        lineHeight: 22,
    },
});
