import FileAttachment from "@/components/ui/FileAttachment";
import { ResizeImage } from "@/components/ui/ResizeImage";
import { getAttachmentSignedUrl, isImageMime, LoadedAttachment } from "@/services/messageService";
import { useEffect, useState } from "react";
import { View } from "react-native";

const AttachmentImages = ({ attachments }: { attachments: LoadedAttachment[] }) => {
    const [urls, setUrls] = useState<Record<string, string>>({});

    useEffect(() => {
        let cancelled = false;
        const hydrate = async () => {
            const entries = await Promise.all(
                attachments.map(async (a) => {
                    const signedUrl = await getAttachmentSignedUrl(a.path);
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
    }, [attachments]);

    return (
        <>
            {attachments.map((a) => {
                const url = urls[a.path];

                if (!url) return null; // could show a spinner placeholder
                return (
                    <View key={a.path}>
                        {isImageMime(a.mime_type) ? (
                            <ResizeImage width={156} url={url} />
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
