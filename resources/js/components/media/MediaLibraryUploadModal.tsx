import { router } from '@inertiajs/react';
import {
    Check,
    Download,
    File,
    Folder,
    Image as ImageIcon,
    UploadCloud,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { isImageMedia, mediaUrl } from '@/lib/media';

export interface MediaLibraryItem {
    type: 'folder' | 'file';
    name: string;
    path: string;
    url: string | null;
    mime_type: string | null;
    size: number | null;
    last_modified: string | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    items: MediaLibraryItem[];
    currentPath: string;
    loading?: boolean;
    onOpenFolder: (path: string) => void;
    onSelectFile?: (item: MediaLibraryItem) => void;
    onUploaded?: (item: MediaLibraryItem) => void;
    autoSelectUploaded?: boolean;
}

export default function MediaLibraryUploadModal({
    isOpen,
    onClose,
    items,
    currentPath,
    loading = false,
    onOpenFolder,
    onSelectFile,
    onUploaded,
    autoSelectUploaded = false,
}: Props) {
    const [tab, setTab] = useState<'library' | 'upload'>('library');
    const [selectedItem, setSelectedItem] = useState<MediaLibraryItem | null>(
        null,
    );
    const [uploading, setUploading] = useState(false);

    const isImage = (item: MediaLibraryItem) => isImageMedia(item);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (!acceptedFiles.length) {
                return;
            }

            setUploading(true);
            const toastId = toast.loading('Uploading media...');

            let failedUploads = 0;
            let firstUploadedItem: MediaLibraryItem | null = null;

            for (const file of acceptedFiles) {
                await new Promise<void>((resolve) => {
                    const formData = new FormData();
                    formData.append('file', file);

                    const csrfToken = document
                        .querySelector<HTMLMetaElement>(
                            'meta[name="csrf-token"]',
                        )
                        ?.getAttribute('content');

                    fetch('/my-admin/dashboard/media/json', {
                        method: 'POST',
                        headers: csrfToken
                            ? { 'X-CSRF-TOKEN': csrfToken }
                            : undefined,
                        body: formData,
                    })
                        .then(async (response) => {
                            if (!response.ok) {
                                throw new Error('Upload failed');
                            }

                            const result = await response.json();
                            const media = result.media;
                            const item: MediaLibraryItem = {
                                type: 'file',
                                name: media.file_name,
                                path: media.path,
                                url:
                                    result.url ??
                                    result.location ??
                                    media.url ??
                                    mediaUrl(media.path),
                                mime_type: media.mime_type,
                                size: media.size,
                                last_modified: media.updated_at ?? null,
                            };

                            firstUploadedItem ??= item;
                        })
                        .catch(() => {
                            failedUploads++;
                        })
                        .finally(() => resolve());
                });
            }

            if (failedUploads > 0) {
                toast.error(`${failedUploads} file gagal diupload`, {
                    id: toastId,
                });
            } else {
                toast.success('Media berhasil diupload', { id: toastId });
            }

            setUploading(false);

            if (autoSelectUploaded && firstUploadedItem) {
                onUploaded?.(firstUploadedItem);
                onSelectFile?.(firstUploadedItem);
                onClose();

                return;
            }

            if (firstUploadedItem) {
                onUploaded?.(firstUploadedItem);
            }

            setTab('library');
            router.reload({
                only: ['storageItems', 'breadcrumbs', 'currentPath'],
            });
        },
        [autoSelectUploaded, onClose, onSelectFile, onUploaded],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
    });

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="flex h-[90vh] max-w-[96vw] flex-col gap-0 p-0 sm:max-w-6xl">
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle>Upload Media</DialogTitle>
                </DialogHeader>

                <div className="flex border-b px-6">
                    <button
                        type="button"
                        onClick={() => setTab('library')}
                        className={`border-b-2 px-1 py-3 text-sm ${
                            tab === 'library'
                                ? 'border-primary font-semibold text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Media Library
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('upload')}
                        className={`ml-8 border-b-2 px-1 py-3 text-sm ${
                            tab === 'upload'
                                ? 'border-primary font-semibold text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Upload Files
                    </button>
                </div>

                {tab === 'library' ? (
                    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_320px]">
                        <div className="min-h-0 overflow-y-auto p-6">
                            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                                <ImageIcon className="h-4 w-4" />
                                <span>
                                    {currentPath
                                        ? `storage/app/public/${currentPath}`
                                        : 'storage/app/public'}
                                </span>
                            </div>

                            {loading ? (
                                <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                                    Loading media...
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                                    {items.map((item) => (
                                        <button
                                            key={`${item.type}:${item.path}`}
                                            type="button"
                                            onClick={() => {
                                                if (item.type === 'folder') {
                                                    onOpenFolder(item.path);

                                                    return;
                                                }

                                                setSelectedItem(item);
                                            }}
                                            className={`group aspect-square overflow-hidden rounded-lg border bg-card text-left transition hover:border-primary ${
                                                selectedItem?.path === item.path
                                                    ? 'ring-2 ring-primary'
                                                    : ''
                                            }`}
                                        >
                                            {item.type === 'folder' ? (
                                                <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
                                                    <Folder className="h-12 w-12 text-amber-500" />
                                                    <span className="line-clamp-2 text-sm font-medium">
                                                        {item.name}
                                                    </span>
                                                </div>
                                            ) : isImage(item) && item.url ? (
                                                <img
                                                    src={item.url}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
                                                    <File className="h-12 w-12 text-muted-foreground" />
                                                    <span className="line-clamp-2 text-sm font-medium">
                                                        {item.name}
                                                    </span>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {!loading && items.length === 0 && (
                                <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                                    Belum ada media di folder ini.
                                </div>
                            )}
                        </div>

                        <aside className="min-h-0 overflow-y-auto border-l bg-muted/20 p-6">
                            {selectedItem ? (
                                <div className="space-y-4">
                                    <div className="rounded-lg border bg-background p-3">
                                        {isImage(selectedItem) &&
                                        selectedItem.url ? (
                                            <img
                                                src={selectedItem.url}
                                                alt={selectedItem.name}
                                                className="max-h-56 w-full object-contain"
                                            />
                                        ) : (
                                            <div className="flex h-40 items-center justify-center">
                                                <File className="h-12 w-12 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground">
                                            FILE NAME
                                        </p>
                                        <p className="text-sm font-medium break-all">
                                            {selectedItem.name}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground">
                                            TYPE
                                        </p>
                                        <p className="text-sm">
                                            {selectedItem.mime_type || '-'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground">
                                            PATH
                                        </p>
                                        <p className="font-mono text-xs break-all">
                                            {selectedItem.path}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                                    Pilih file untuk melihat detail.
                                </div>
                            )}
                        </aside>
                    </div>
                ) : (
                    <div className="flex min-h-0 flex-1 p-6">
                        <div
                            {...getRootProps()}
                            className={`flex flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition ${
                                isDragActive
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:bg-muted/40'
                            }`}
                        >
                            <input {...getInputProps()} />
                            <UploadCloud className="mb-4 h-14 w-14 text-muted-foreground" />
                            <p className="text-lg font-semibold">
                                Drop files to upload
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                atau klik area ini untuk memilih file dari
                                komputer.
                            </p>
                            <Button
                                type="button"
                                className="mt-6"
                                disabled={uploading}
                            >
                                {uploading ? 'Uploading...' : 'Select Files'}
                            </Button>
                        </div>
                    </div>
                )}

                <DialogFooter className="border-t px-6 py-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    {tab === 'library' && selectedItem && (
                        <Button
                            type="button"
                            onClick={() => {
                                onSelectFile?.(selectedItem);
                                onClose();
                            }}
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Select
                        </Button>
                    )}
                    {tab === 'library' && selectedItem?.url && (
                        <a href={selectedItem.url} download>
                            <Button type="button" variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        </a>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
