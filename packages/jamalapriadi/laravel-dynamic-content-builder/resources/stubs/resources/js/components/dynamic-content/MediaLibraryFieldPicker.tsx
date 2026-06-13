import { useEffect, useMemo, useState } from 'react';

import type { MediaLibraryItem } from '@/types/dynamic-content';

interface Props {
    values: string[];
    endpoints: {
        index: string;
        store: string;
    };
    multiple?: boolean;
    onChange: (values: string[]) => void;
}

const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

export default function MediaLibraryFieldPicker({
    values,
    endpoints,
    multiple = false,
    onChange,
}: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [items, setItems] = useState<MediaLibraryItem[]>([]);

    useEffect(() => {
        if (!open) {
            return;
        }

        setLoading(true);

        fetch(endpoints.index)
            .then((response) => response.json())
            .then((payload) => {
                setItems(Array.isArray(payload.data) ? payload.data : []);
            })
            .finally(() => setLoading(false));
    }, [endpoints.index, open]);

    const selectedSet = useMemo(() => new Set(values), [values]);

    const toggleSelect = (item: MediaLibraryItem) => {
        if (! multiple) {
            onChange([item.path]);
            setOpen(false);

            return;
        }

        if (selectedSet.has(item.path)) {
            onChange(values.filter((value) => value !== item.path));

            return;
        }

        onChange([...values, item.path]);
    };

    const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const token = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);

        try {
            const response = await fetch(endpoints.store, {
                method: 'POST',
                headers: token ? { 'X-CSRF-TOKEN': token } : undefined,
                body: formData,
            });
            const payload = await response.json();
            const item = payload.data as MediaLibraryItem;

            if (item?.path) {
                setItems((current) => [item, ...current.filter((entry) => entry.path !== item.path)]);

                if (multiple) {
                    onChange(Array.from(new Set([...values, item.path])));
                } else {
                    onChange([item.path]);
                }
            }
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    return (
        <div className="space-y-3">
            {values.length > 0 && (
                <div className={`grid gap-3 ${multiple ? 'md:grid-cols-2' : ''}`}>
                    {values.map((value) => {
                        const item = items.find((entry) => entry.path === value);
                        const previewUrl = item?.url ?? `/storage/${value}`;
                        const isImage = imageTypes.includes(item?.mime_type ?? '');

                        return (
                            <div key={value} className="rounded-lg border border-slate-200 bg-white p-3">
                                {isImage ? (
                                    <img
                                        src={previewUrl}
                                        alt={item?.name ?? value}
                                        className="mb-3 h-32 w-full rounded-md object-cover"
                                    />
                                ) : (
                                    <div className="mb-3 rounded-md bg-slate-100 p-4 text-sm text-slate-500">
                                        {item?.name ?? value}
                                    </div>
                                )}

                                <div className="flex items-center justify-between gap-3">
                                    <p className="min-w-0 truncate text-xs text-slate-500">{value}</p>
                                    <button
                                        type="button"
                                        onClick={() => onChange(values.filter((entry) => entry !== value))}
                                        className="text-sm text-red-600 hover:text-red-700"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={() => setOpen((current) => !current)}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    {open ? 'Hide Library' : 'Browse Library'}
                </button>

                <label className="cursor-pointer rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                    {uploading ? 'Uploading...' : 'Upload File'}
                    <input type="file" className="hidden" onChange={upload} />
                </label>
            </div>

            {open && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    {loading ? (
                        <p className="text-sm text-slate-500">Loading media library...</p>
                    ) : items.length === 0 ? (
                        <p className="text-sm text-slate-500">No uploaded files yet.</p>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {items.map((item) => {
                                const selected = selectedSet.has(item.path);
                                const isImage = imageTypes.includes(item.mime_type ?? '');

                                return (
                                    <button
                                        key={item.path}
                                        type="button"
                                        onClick={() => toggleSelect(item)}
                                        className={`overflow-hidden rounded-lg border text-left transition ${
                                            selected
                                                ? 'border-slate-900 ring-2 ring-slate-200'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        {isImage ? (
                                            <img
                                                src={item.url}
                                                alt={item.name}
                                                className="h-32 w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-32 items-center justify-center bg-white text-sm text-slate-500">
                                                {item.name}
                                            </div>
                                        )}
                                        <div className="space-y-1 bg-white p-3">
                                            <p className="truncate text-sm font-medium text-slate-900">
                                                {item.name}
                                            </p>
                                            <p className="truncate text-xs text-slate-500">
                                                {item.path}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
