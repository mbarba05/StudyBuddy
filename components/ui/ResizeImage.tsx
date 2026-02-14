import { Image } from "expo-image";

export function ResizeImage({ url, width, aspectRatio }: { url: string; width: number; aspectRatio: number }) {
    const blurhash =
        "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";
    return (
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
    );
}
