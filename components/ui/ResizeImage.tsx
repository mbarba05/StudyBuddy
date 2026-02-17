import { colors } from "@/assets/colors";
import { saveImage } from "@/lib/utillities";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { Modal, Pressable, StatusBar, View } from "react-native";

export function ResizeImage({ url, width, aspectRatio }: { url: string; width: number; aspectRatio: number }) {
    const [fullscreenVisible, setFullscreenVisible] = useState(false);
    const [headerVisible, setHeaderVisible] = useState(false);
    const [saveInProg, setSaveInProg] = useState(false);
    const [saved, setSaved] = useState(false);

    const blurhash =
        "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

    const onSave = async () => {
        if (saved) return; //dont allow double saves
        setSaveInProg(true);
        await saveImage(url);
        setSaveInProg(false);
        setSaved(true);
    };

    const onClose = () => {
        setFullscreenVisible(false);
        setHeaderVisible(false);
        setSaveInProg(false);
        setSaved(false);
    };

    return (
        <>
            <Pressable onPress={() => setFullscreenVisible(true)}>
                <Image
                    source={{ uri: url }}
                    style={{
                        width,
                        aspectRatio,
                        borderRadius: 12,
                    }}
                    cachePolicy={"memory-disk"}
                    placeholder={{ blurhash }}
                />
            </Pressable>

            <Modal
                visible={fullscreenVisible}
                transparent={false}
                animationType="slide"
                onRequestClose={onClose}
                allowSwipeDismissal
            >
                <StatusBar hidden={fullscreenVisible && !headerVisible} />

                <View style={{ flex: 1, backgroundColor: "black" }}>
                    {/* IMAGE LAYER */}
                    <Pressable style={{ flex: 1 }} onPress={() => setHeaderVisible((v) => !v)}>
                        <Image
                            source={{ uri: url }}
                            style={{ flex: 1, width: "100%" }}
                            contentFit="contain" // expo-image: keep whole image visible
                            cachePolicy="memory-disk"
                            placeholder={{ blurhash }}
                        />
                    </Pressable>

                    {/* HEADER OVERLAY */}
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
                            <Pressable onPress={onClose}>
                                <Ionicons size={32} color={colors.text} name="close" />
                            </Pressable>

                            <Pressable onPress={onSave}>
                                {
                                    <Ionicons
                                        size={32}
                                        color={saved ? colors.success : saveInProg ? colors.textSecondary : colors.text}
                                        name={saved ? "download" : `download-outline`}
                                    />
                                }
                            </Pressable>
                        </View>
                    )}
                </View>
            </Modal>
        </>
    );
}
