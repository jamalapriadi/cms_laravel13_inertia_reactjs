import { router } from '@inertiajs/react';
import { useMediaUrl } from '@/lib/media';
import type { Media } from '@/types/media';

interface Props {
    media: Media | null;
    onUpdate: (media: Media) => void;
}

export default function MediaSidebar({ media, onUpdate }: Props) {
    const previewUrl = useMediaUrl(media?.path);

    if (!media) return <p className="text-muted-foreground">Select a file</p>;

    const selectedMedia = media;

    function updateAlt(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;

        router.put(
            `/dashboard/media/${selectedMedia.id}`,
            {
                alt: value,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onUpdate({ ...selectedMedia, alt: value });
                },
            },
        );
    }

    return (
        <div>
            <img
                src={media.url ?? previewUrl ?? ''}
                className="mb-4 w-full rounded"
            />

            <p className="mb-1 text-sm">
                <strong>File name:</strong> {media.file_name}
            </p>

            <p className="mb-1 text-sm">
                <strong>Type:</strong> {media.mime_type}
            </p>

            <p className="mb-3 text-sm">
                <strong>Dimensions:</strong> {media.width} x {media.height}
            </p>

            <label className="mb-1 block text-sm">Alt Text</label>
            <input
                type="text"
                value={media.alt ?? ''}
                onChange={updateAlt}
                className="w-full rounded border p-2 text-sm"
            />
        </div>
    );
}
