import { usePage } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { mediaUrl, useMediaUrl } from '@/lib/media';

interface Media {
    id: string;
    path: string;
}

interface Props {
    value?: string;
    onUploaded?: (media: Media) => void;
}

export default function ImageDropzone({ value, onUploaded }: Props) {
    const mediaUrlBase = (usePage().props as { mediaUrlBase?: string })
        .mediaUrlBase;
    const initialPreview = useMediaUrl(value);
    const [preview, setPreview] = useState<string | null>(initialPreview);
    const [loading, setLoading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);

        try {
            const res = await axios.post(
                '/my-admin/dashboard/media/upload',
                formData,
            );

            const media = res.data.media;

            setPreview(media.url ?? mediaUrl(media.path, mediaUrlBase));

            if (onUploaded) onUploaded(media);
        } catch (e) {
            console.error(e);
        }

        setLoading(false);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': [],
        },
        multiple: false,
    });

    return (
        <div
            {...getRootProps()}
            className={`flex h-48 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition ${isDragActive ? 'border-blue-500 bg-blue-100 dark:bg-blue-950/40' : 'border-border'} `}
        >
            <input {...getInputProps()} />

            {loading && (
                <p className="text-sm text-muted-foreground">Uploading...</p>
            )}

            {!loading && preview && (
                <img
                    src={preview}
                    className="h-full w-full rounded object-cover"
                />
            )}

            {!loading && !preview && (
                <div className="text-center text-muted-foreground">
                    <p className="text-sm font-medium">Drag & Drop image</p>
                    <p className="text-xs">or click to upload</p>
                </div>
            )}
        </div>
    );
}
