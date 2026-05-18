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

    editor: ({ data, onChange }: any) => {
        const url = data?.url ?? '';
        const alt = data?.alt ?? '';

        return (
            <div className="space-y-3">
                {/* PREVIEW */}
                {url && (
                    <div className="overflow-hidden rounded border">
                        <img
                            src={url}
                            alt={alt}
                            className="h-auto w-full object-cover"
                        />
                    </div>
                )}

                {/* URL */}
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

                {/* ALT */}
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
    },
};
