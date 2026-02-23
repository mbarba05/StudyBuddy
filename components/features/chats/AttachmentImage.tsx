import { colors } from "@/assets/colors";
import FileAttachment from "@/components/ui/FileAttachment";
import { ResizeImage } from "@/components/ui/ResizeImage";
import { getAttachmentSignedUrlCached, isImageMime, LoadedAttachment } from "@/services/messageService";
import { useEffect, useState } from "react";
import { View } from "react-native";

const ratioCache = new Map<string, number>();

const AttachmentImages = ({ attachments }: { attachments: LoadedAttachment[] }) => {
    const [urls, setUrls] = useState<Record<string, string>>({});

    useEffect(() => {
        let cancelled = false;

        const hydrate = async () => {
            const missing = attachments.filter((a) => !urls[a.path]); // only missing
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

    return (
        <>
            {attachments.map((a) => {
                const url = urls[a.path];
                const BOX_WIDTH = 156;

                return (
                    <View
                        key={a.path}
                        style={{
                            width: BOX_WIDTH,
                            aspectRatio: a.aspect_ratio,
                            borderRadius: 12,
                            overflow: "hidden",
                            backgroundColor: colors.secondary,
                            marginBottom: 8,
                        }}
                    >
                        {!url ? (
                            <View style={{ flex: 1, opacity: 0.3 /* or a skeleton */ }} />
                        ) : isImageMime(a.mime_type) ? (
                            <ResizeImage width={BOX_WIDTH} url={url} aspectRatio={a.aspect_ratio} />
                        ) : (
                            <FileAttachment mime_type={a.mime_type} path={a.path} />
                        )}
                    </View>
                );
            })}
        </>
    );
};

export default AttachmentImages;
