import { colors } from "@/assets/colors";
import FileAttachment from "@/components/ui/FileAttachment";
import { ResizeImage } from "@/components/ui/ResizeImage";
import { saveImage } from "@/lib/utillities";
import { getAttachmentSignedUrlCached, isImageMime, LoadedAttachment } from "@/services/messageService";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StatusBar, Text, View } from "react-native";
import PagerView from "react-native-pager-view";

const BOX_WIDTH = 200;

const AttachmentImages = ({ attachments }: { attachments: LoadedAttachment[] }) => {
    const [urls, setUrls] = useState<Record<string, string>>({});
    const [index, setIndex] = useState(0);

    // fullscreen state lives HERE now
    const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
    const [headerVisible, setHeaderVisible] = useState(false);
    const [saveInProg, setSaveInProg] = useState(false);
    const [saved, setSaved] = useState(false);

    const smallestAspectRatio = useMemo(() => {
        const ratios = attachments
            .filter((a) => isImageMime(a.mime_type))
            .map((a) => a.aspect_ratio)
            .filter((r): r is number => typeof r === "number" && isFinite(r));

        return ratios.length ? Math.min(...ratios) : 1;
    }, [attachments]);

    useEffect(() => {
        let cancelled = false;

        const hydrate = async () => {
            const missing = attachments.filter((a) => !urls[a.path]);
            if (missing.length === 0) return;

            const entries = await Promise.all(
                missing.map(async (a) => {
                    const signedUrl = await getAttachmentSignedUrlCached(a.path);
                    return [a.path, signedUrl] as const;
                }),
            );

            if (!cancelled) {
                setUrls((prev) => {
                    const next = { ...prev };
                    for (const [path, url] of entries) next[path] = url;
                    return next;
                });
            }
        };

        hydrate();
        return () => {
            cancelled = true;
        };
    }, [attachments, urls]);

    const openFullscreen = (i: number) => {
        setFullscreenIndex(i);
        setHeaderVisible(false);
        setSaveInProg(false);
        setSaved(false);
    };

    const closeFullscreen = () => {
        setFullscreenIndex(null);
        setHeaderVisible(false);
        setSaveInProg(false);
        setSaved(false);
    };

    const onSave = async () => {
        if (saved || fullscreenIndex == null) return;
        const a = attachments[fullscreenIndex];
        const url = urls[a.path];
        if (!url) return;

        setSaveInProg(true);
        await saveImage(url);
        setSaveInProg(false);
        setSaved(true);
    };

    const renderAttachment = (a: LoadedAttachment, i: number) => {
        return (
            <View
                key={a.id}
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                {!urls[a.path] ? (
                    <View style={{ opacity: 0.3 }} />
                ) : isImageMime(a.mime_type) ? (
                    <ResizeImage
                        width={BOX_WIDTH}
                        url={urls[a.path]}
                        aspectRatio={a.aspect_ratio}
                        onPress={() => openFullscreen(i)}
                    />
                ) : (
                    <FileAttachment mime_type={a.mime_type} path={a.path} />
                )}
            </View>
        );
    };

    const fullscreenUrl = fullscreenIndex == null ? null : urls[attachments[fullscreenIndex]?.path];

    return (
        <>
            <View
                style={{
                    width: BOX_WIDTH,
                    aspectRatio: smallestAspectRatio,
                    borderRadius: 12,
                    overflow: "hidden",
                    backgroundColor: colors.secondary,
                }}
            >
                {attachments.length === 1 ? (
                    renderAttachment(attachments[0], 0)
                ) : (
                    <>
                        <PagerView
                            style={{ flex: 1 }}
                            onPageSelected={(e) => setIndex(e.nativeEvent.position)}
                            initialPage={0}
                        >
                            {attachments.map((a, i) => renderAttachment(a, i))}
                        </PagerView>

                        <View
                            pointerEvents="none"
                            style={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 999,
                                backgroundColor: "rgba(0,0,0,0.35)",
                            }}
                        >
                            <Text style={{ color: "white", fontSize: 12 }}>
                                {index + 1}/{attachments.length}
                            </Text>
                        </View>
                    </>
                )}
            </View>

            {/* SINGLE fullscreen modal, not inside pager pages */}
            <Modal
                visible={fullscreenIndex != null}
                transparent={false}
                animationType="slide"
                onRequestClose={closeFullscreen}
            >
                <StatusBar hidden={fullscreenIndex != null && !headerVisible} />
                <View style={{ flex: 1, backgroundColor: "black" }}>
                    <Pressable style={{ flex: 1 }} onPress={() => setHeaderVisible((v) => !v)}>
                        {fullscreenUrl ? (
                            <Image
                                source={{ uri: fullscreenUrl }}
                                style={{ flex: 1, width: "100%" }}
                                contentFit="contain"
                                cachePolicy="memory-disk"
                            />
                        ) : (
                            <View style={{ flex: 1 }} />
                        )}
                    </Pressable>

                    {headerVisible && (
                        <View
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 96,
                                paddingHorizontal: 16,
                                paddingBottom: 12,
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "flex-end",
                                zIndex: 10,
                                backgroundColor: colors.background,
                            }}
                        >
                            <Pressable onPress={closeFullscreen}>
                                <Ionicons size={32} color={colors.text} name="close" />
                            </Pressable>

                            <Pressable onPress={onSave}>
                                <Ionicons
                                    size={32}
                                    color={saved ? colors.success : saveInProg ? colors.textSecondary : colors.text}
                                    name={saved ? "download" : "download-outline"}
                                />
                            </Pressable>
                        </View>
                    )}
                </View>
            </Modal>
        </>
    );
};

export default AttachmentImages;
