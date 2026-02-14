import { useEffect, useState } from "react";
import { Image } from "react-native";

//this component dynamically calculates the aspect ratio of an image before it displays it

export function ResizeImage({ url, width }: { url: string; width: number }) {
    const [ratio, setRatio] = useState(1);

    useEffect(() => {
        Image.getSize(url, (width, height) => {
            setRatio(width / height);
        });
    }, [url]);

    return (
        <Image
            source={{ uri: url }}
            style={{
                width: width,
                aspectRatio: ratio,
                borderRadius: 12,
            }}
            resizeMode="cover"
        />
    );
}
