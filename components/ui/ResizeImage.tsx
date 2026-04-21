import { colors } from "@/assets/colors";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { Modal, Pressable, StatusBar, StyleSheet, View } from "react-native";

type ResizeImageProps = {
    url: string;
    width: number;
    aspectRatio: number;
    borderRadius?: number;
    testID?: string;
};

export function ResizeImage({ url, width, aspectRatio, borderRadius = 12, testID }: ResizeImageProps) {
    const [fullscreenVisible, setFullscreenVisible] = useState(false);

    const blurhash =
        "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

    const onClose = () => {
        setFullscreenVisible(false);
    };
    const styles = StyleSheet.create({
        modalContainer: {
            flex: 1,
            backgroundColor: colors.black,
        },
        imageLayer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 32,
        },
        fullscreenImage: {
            width: "100%",
            height: "80%",
        },
        topBar: {
            position: "absolute",
            top: 20,
            right: 20,
        },
        closeButton: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
        },
    });

    return (
        <>
            <Pressable disabled={!url} onPress={() => setFullscreenVisible(true)}>
                <Image
                    source={{ uri: url }}
                    style={{
                        width,
                        aspectRatio,
                        borderRadius,
                    }}
                    testID={testID ?? url}
                    cachePolicy={"memory-disk"}
                    placeholder={{ blurhash }}
                />
            </Pressable>

            <Modal visible={fullscreenVisible} transparent={false} animationType="fade" onRequestClose={onClose}>
                <StatusBar hidden />

                <View style={styles.modalContainer}>
                    <Pressable style={styles.imageLayer} onPress={onClose}>
                        <Image
                            source={{ uri: url }}
                            style={styles.fullscreenImage}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                            placeholder={{ blurhash }}
                        />
                    </Pressable>

                    <View style={styles.topBar}>
                        <Pressable hitSlop={12} style={styles.closeButton} onPress={onClose}>
                            <Ionicons size={24} color={colors.text} name="close" />
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </>
    );
}
