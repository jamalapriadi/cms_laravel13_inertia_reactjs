import { Image as ImageIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import MediaLibraryUploadModal from '@/components/media/MediaLibraryUploadModal';
import type { MediaLibraryItem } from '@/components/media/MediaLibraryUploadModal';
import { Button } from '@/components/ui/button';
import { useMediaUrl } from '@/lib/media';

interface Props {
    value?: string | null;
    onChange: (path: string | null) => void;
    label?: string;
}

export default function MediaImagePicker({ value, onChange, label }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState<MediaLibraryItem[]>([]);
    const [currentPath, setCurrentPath] = useState('');
    const [loading, setLoading] = useState(false);
    const previewUrl = useMediaUrl(value);

    const loadLibrary = async (path = '') => {
        setLoading(true);

        try {
            const response = await fetch(
                `/dashboard/media/library?path=${encodeURIComponent(path)}`,
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

    const selectItem = (item: MediaLibraryItem) => {
        onChange(item.path);
    };

    return (
        <div className="space-y-3">
            {label && <p className="text-sm font-medium">{label}</p>}

            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex min-h-36 w-full cursor-pointer items-center justify-center rounded-lg border border-dashed bg-muted/30 p-4 text-center transition hover:bg-muted/60"
            >
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt={label ?? 'Selected media'}
                        className="max-h-40 max-w-full rounded object-contain"
                    />
                ) : (
                    <div className="space-y-2 text-muted-foreground">
                        <ImageIcon className="mx-auto h-10 w-10" />
                        <p className="text-sm">
                            Select or upload image from Media Library
                        </p>
                    </div>
                )}
            </button>

            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(true)}
                >
                    Select Image
                </Button>
                {value && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onChange('')}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Remove
                    </Button>
                )}
            </div>

            <MediaLibraryUploadModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                items={items}
                currentPath={currentPath}
                loading={loading}
                onOpenFolder={loadLibrary}
                onSelectFile={selectItem}
                onUploaded={(item) => {
                    setItems((currentItems) => [item, ...currentItems]);
                    selectItem(item);
                }}
                autoSelectUploaded
            />
        </div>
    );
}
