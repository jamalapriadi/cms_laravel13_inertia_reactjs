import { File, Image as ImageIcon, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import MediaLibraryUploadModal from '@/components/media/MediaLibraryUploadModal';
import type { MediaLibraryItem } from '@/components/media/MediaLibraryUploadModal';
import { Button } from '@/components/ui/button';
import { isImagePath, mediaUrl } from '@/lib/media';

interface Props {
    label?: string;
    values: string[];
    multiple?: boolean;
    onChange: (values: string[]) => void;
}

export default function MediaLibraryFieldPicker({
    label,
    values,
    multiple = false,
    onChange,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState<MediaLibraryItem[]>([]);
    const [currentPath, setCurrentPath] = useState('');
    const [loading, setLoading] = useState(false);

    const loadLibrary = async (path = '') => {
        setLoading(true);

        try {
            const response = await fetch(
                `/my-admin/dashboard/media/library?path=${encodeURIComponent(path)}`,
            );
            const result = await response.json();

            setItems(result.storageItems ?? []);
            setCurrentPath(result.currentPath ?? path);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadLibrary(currentPath);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleSelect = (item: MediaLibraryItem) => {
        if (multiple) {
            onChange(Array.from(new Set([...values, item.path])));

            return;
        }

        onChange([item.path]);
    };

    const removeValue = (value: string) => {
        onChange(values.filter((item) => item !== value));
    };

    return (
        <div className="space-y-3">
            {label && <p className="text-sm font-medium">{label}</p>}

            {values.length > 0 ? (
                <div
                    className={`grid gap-3 ${multiple ? 'sm:grid-cols-2 xl:grid-cols-3' : ''}`}
                >
                    {values.map((value) => {
                        const previewUrl = mediaUrl(value);
                        const image = isImagePath(value);

                        return (
                            <div
                                key={value}
                                className="rounded-lg border bg-card p-3"
                            >
                                {image && previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt={label ?? 'Selected media'}
                                        className="mb-3 h-36 w-full rounded-md object-cover"
                                    />
                                ) : (
                                    <div className="mb-3 flex h-24 items-center justify-center rounded-md border bg-muted/40">
                                        <File className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <p className="text-xs break-all text-muted-foreground">
                                        {value}
                                    </p>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeValue(value)}
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="flex min-h-32 w-full items-center justify-center rounded-lg border border-dashed bg-muted/20 p-4 text-center text-sm text-muted-foreground transition hover:bg-muted/40"
                >
                    <div className="space-y-2">
                        <ImageIcon className="mx-auto h-8 w-8" />
                        <p>
                            {multiple
                                ? 'Select one or more files from media library'
                                : 'Select file from media library'}
                        </p>
                    </div>
                </button>
            )}

            <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(true)}
            >
                <Plus className="mr-2 h-4 w-4" />
                {multiple
                    ? 'Add Media'
                    : values.length > 0
                      ? 'Replace Media'
                      : 'Select Media'}
            </Button>

            <MediaLibraryUploadModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                items={items}
                currentPath={currentPath}
                loading={loading}
                onOpenFolder={loadLibrary}
                onSelectFile={handleSelect}
                onUploaded={(item) => {
                    setItems((currentItems) => [item, ...currentItems]);
                    handleSelect(item);
                }}
            />
        </div>
    );
}
