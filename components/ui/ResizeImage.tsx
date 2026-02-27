import { Image } from "expo-image";
import { Pressable } from "react-native";

export function ResizeImage({
    url,
    width,
    aspectRatio,
    onPress,
}: {
    url: string;
    width: number;
    aspectRatio: number;
    onPress?: () => void;
}) {
    const blurhash =
        "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

    return (
        <Pressable onPress={onPress}>
            <Image
                source={{ uri: url }}
                style={{ width, aspectRatio, borderRadius: 12 }}
                cachePolicy="memory-disk"
                placeholder={{ blurhash }}
            />
        </Pressable>
    );
}
