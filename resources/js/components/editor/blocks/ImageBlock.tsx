import { useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';

function ImageEditor({ data, onChange }: any) {
    const [isUploading, setIsUploading] = useState(false);
    const url = data?.url ?? '';
    const alt = data?.alt ?? '';

    const uploadImage = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        setIsUploading(true);

        try {
            const response = await fetch('/dashboard/media/upload', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Upload failed');
            }

            onChange({
                url: result.url,
                media_id: result.media?.id,
                alt: alt || result.media?.alt || '',
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-3">
            {url && (
                <div className="overflow-hidden rounded border">
                    <img
                        src={url}
                        alt={alt}
                        className="h-auto w-full object-cover"
                    />
                </div>
            )}

            <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed bg-muted/30 p-4 text-center text-sm transition hover:bg-muted/60">
                {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <ImagePlus className="h-5 w-5 text-primary" />
                )}
                <span className="font-medium">
                    {isUploading ? 'Uploading...' : 'Upload image'}
                </span>
                <span className="text-xs text-muted-foreground">
                    JPG, PNG, WebP maksimal 2MB
                </span>
                <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={isUploading}
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            uploadImage(file);
                        }
                        e.currentTarget.value = '';
                    }}
                />
            </label>

            <div>
                <label className="text-xs text-muted-foreground">
                    Image URL
                </label>
                <input
                    className="w-full rounded border p-2"
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => onChange({ url: e.target.value })}
                />
            </div>

            <div>
                <label className="text-xs text-muted-foreground">
                    Alt text
                </label>
                <input
                    className="w-full rounded border p-2"
                    placeholder="Describe the image..."
                    value={alt}
                    onChange={(e) => onChange({ alt: e.target.value })}
                />
            </div>
        </div>
    );
}

export default {
    type: 'image',

    create: () => ({
        url: '',
        alt: '',
    }),

    render: ({ data }: any) => {
        const url = data?.url ?? '';
        const alt = data?.alt ?? '';

        if (!url) {
            return (
                <div className="flex items-center justify-center rounded border border-dashed p-6 text-sm text-muted-foreground">
                    No image selected
                </div>
            );
        }

        return (
            <div className="overflow-hidden rounded">
                <img
                    src={url}
                    alt={alt}
                    className="h-auto w-full object-cover"
                    loading="lazy"
                />
            </div>
        );
    },

    editor: (props: any) => <ImageEditor {...props} />,
};
