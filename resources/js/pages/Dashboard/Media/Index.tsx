import { Head, router } from '@inertiajs/react';
import {
    LayoutGrid,
    List,
    Search,
    Calendar,
    Copy,
    Download,
    Image as ImageIcon,
    Plus,
    Monitor,
    Folder,
    File,
    HardDrive,
    ChevronRight,
} from 'lucide-react';

import { useState } from 'react';
import { toast } from 'sonner';

import MediaLibraryUploadModal from '@/components/media/MediaLibraryUploadModal';
import type { MediaLibraryItem } from '@/components/media/MediaLibraryUploadModal';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type StorageItem = MediaLibraryItem;

interface BreadcrumbItem {
    name: string;
    path: string;
}

interface Props {
    storageItems: StorageItem[];
    currentPath: string;
    breadcrumbs: BreadcrumbItem[];
    filters: {
        search?: string;
        date?: string;
    };
}

export default function Index({
    storageItems,
    currentPath,
    breadcrumbs,
    filters,
}: Props) {
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [selectedFile, setSelectedFile] = useState<StorageItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

    const handleFilter = (key: string, value: string) => {
        router.get(
            '/dashboard/media',
            { ...filters, path: currentPath, [key]: value },
            { preserveState: true, replace: true },
        );
    };

    const openFolder = (path: string) => {
        router.get(
            '/dashboard/media',
            { path, search: filters.search, date: filters.date },
            { preserveState: true },
        );
    };

    const formatFileSize = (size: number | null) => {
        if (!size) {
            return '-';
        }

        const units = ['B', 'KB', 'MB', 'GB'];
        let value = size;
        let unitIndex = 0;

        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex++;
        }

        return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
    };

    const isImage = (item: StorageItem) =>
        typeof item.mime_type === 'string' &&
        item.mime_type.startsWith('image/');

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Disalin ke clipboard');
    };

    const handleDeleteFile = () => {
        if (!selectedFile) {
            return;
        }

        const toastId = toast.loading('Menghapus file...');

        router.delete('/dashboard/media/storage-file', {
            data: { path: selectedFile.path },
            preserveScroll: true,
            onSuccess: () => {
                toast.success('File berhasil dihapus permanen', {
                    id: toastId,
                });
                setSelectedFile(null);
            },
            onError: () => {
                toast.error('Gagal menghapus file', { id: toastId });
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <>
            <Head title="Media Library" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="flex items-center gap-3 text-2xl font-bold">
                            <ImageIcon className="h-6 w-6 text-primary" />
                            Media Library
                        </h1>
                        <p className="text-muted-foreground">
                            Jelajahi folder dan file di storage publik Laravel
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={() => setIsMediaModalOpen(true)}
                    >
                            <Plus className="mr-2 h-4 w-4" />
                            Upload Media
                    </Button>
                </div>

                <hr />

                <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <button
                        type="button"
                        onClick={() => openFolder('')}
                        className={!currentPath ? 'font-semibold text-primary' : 'text-muted-foreground hover:text-foreground'}
                    >
                        storage/app/public
                    </button>
                    {breadcrumbs.map((item) => (
                        <div key={item.path} className="flex items-center gap-2">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            <button
                                type="button"
                                onClick={() => openFolder(item.path)}
                                className={item.path === currentPath ? 'font-semibold text-primary' : 'text-muted-foreground hover:text-foreground'}
                            >
                                {item.name}
                            </button>
                        </div>
                    ))}
                </div>

                {/* FILTER */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 gap-3">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Cari file..."
                                defaultValue={filters.search}
                                onChange={(e) =>
                                    handleFilter('search', e.target.value)
                                }
                                className="pl-10"
                            />
                        </div>

                        <div className="relative">
                            <Calendar className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="date"
                                defaultValue={filters.date}
                                onChange={(e) =>
                                    handleFilter('date', e.target.value)
                                }
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* VIEW SWITCH */}
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant={view === 'grid' ? 'default' : 'outline'}
                            onClick={() => setView('grid')}
                        >
                            <LayoutGrid className="mr-2 h-4 w-4" />
                            Grid
                        </Button>

                        <Button
                            size="sm"
                            variant={view === 'list' ? 'default' : 'outline'}
                            onClick={() => setView('list')}
                        >
                            <List className="mr-2 h-4 w-4" />
                            List
                        </Button>
                    </div>
                </div>

                {/* CONTENT */}
                {view === 'grid' ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                        {storageItems.map((item) => (
                            <div
                                key={`${item.type}:${item.path}`}
                                role={item.type === 'file' ? 'button' : undefined}
                                tabIndex={item.type === 'file' ? 0 : undefined}
                                onClick={() => {
                                    if (item.type === 'file') {
                                        setSelectedFile(item);
                                    }
                                }}
                                onKeyDown={(event) => {
                                    if (
                                        item.type === 'file' &&
                                        (event.key === 'Enter' ||
                                            event.key === ' ')
                                    ) {
                                        event.preventDefault();
                                        setSelectedFile(item);
                                    }
                                }}
                                className="group relative aspect-square overflow-hidden rounded-xl border bg-card"
                            >
                                {item.type === 'folder' ? (
                                    <button
                                        type="button"
                                        onClick={() => openFolder(item.path)}
                                        className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center hover:bg-muted/60"
                                    >
                                        <Folder className="h-14 w-14 text-amber-500" />
                                        <span className="line-clamp-2 text-sm font-medium">
                                            {item.name}
                                        </span>
                                    </button>
                                ) : isImage(item) && item.url ? (
                                    <img
                                        src={item.url}
                                        className="h-full w-full cursor-pointer object-cover"
                                        alt={item.name}
                                    />
                                ) : (
                                    <div className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 p-4 text-center">
                                        <File className="h-12 w-12 text-muted-foreground" />
                                        <span className="line-clamp-2 text-sm font-medium">
                                            {item.name}
                                        </span>
                                    </div>
                                )}

                                {/* overlay */}
                                {item.type === 'file' && (
                                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-black/60 p-3 opacity-0 transition group-hover:opacity-100">
                                        <p className="truncate text-xs font-semibold text-white">
                                            {item.name}
                                        </p>
                                        <p className="text-[10px] text-white/70">
                                            {item.mime_type}
                                        </p>
                                        <p className="text-[10px] text-white/70">
                                            {formatFileSize(item.size)}
                                        </p>
                                    </div>
                                )}

                                {/* actions */}
                                {item.type === 'file' && item.url && (
                                    <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
                                        <a
                                            href={item.url}
                                            download
                                            onClick={(event) =>
                                                event.stopPropagation()
                                            }
                                        >
                                            <Button size="icon" variant="outline">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border bg-card">
                        <table className="w-full">
                            <thead className="border-b bg-muted text-sm">
                                <tr>
                                    <th className="p-3 text-left">Preview</th>
                                    <th className="p-3 text-left">Nama</th>
                                    <th className="p-3 text-left">Tipe</th>
                                    <th className="p-3 text-right">Aksi</th>
                                </tr>
                            </thead>

                            <tbody>
                                {storageItems.map((item) => (
                                    <tr
                                        key={`${item.type}:${item.path}`}
                                        className="border-b hover:bg-muted/50"
                                    >
                                        <td className="p-3">
                                            {item.type === 'folder' ? (
                                                <Folder className="h-10 w-10 text-amber-500" />
                                            ) : isImage(item) && item.url ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedFile(item)
                                                    }
                                                >
                                                    <img
                                                        src={item.url}
                                                        className="h-12 w-16 rounded object-cover"
                                                        alt={item.name}
                                                    />
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedFile(item)
                                                    }
                                                >
                                                    <File className="h-10 w-10 text-muted-foreground" />
                                                </button>
                                            )}
                                        </td>

                                        <td className="p-3">
                                            {item.type === 'folder' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => openFolder(item.path)}
                                                    className="font-medium text-primary hover:underline"
                                                >
                                                    {item.name}
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedFile(item)
                                                    }
                                                    className="font-medium hover:text-primary hover:underline"
                                                >
                                                    {item.name}
                                                </button>
                                            )}
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Monitor className="h-3 w-3" />
                                                {item.path}
                                            </div>
                                        </td>

                                        <td className="p-3 text-sm">
                                            {item.type === 'folder'
                                                ? 'Folder'
                                                : item.mime_type}
                                        </td>

                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                {item.type === 'file' && item.url && (
                                                    <a href={item.url} download>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {storageItems.length === 0 && (
                    <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
                        Tidak ada folder atau file yang cocok.
                    </div>
                )}
            </div>

            <Dialog
                open={!!selectedFile}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedFile(null);
                    }
                }}
            >
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Detail File</DialogTitle>
                    </DialogHeader>

                    {selectedFile && (
                        <div className="space-y-6">
                            <div className="rounded-lg border bg-muted p-4">
                                {isImage(selectedFile) && selectedFile.url ? (
                                    <img
                                        src={selectedFile.url}
                                        alt={selectedFile.name}
                                        className="max-h-96 w-full object-contain"
                                    />
                                ) : (
                                    <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-background">
                                        <File className="h-14 w-14 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">
                                            File tidak dapat dipratinjau
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground">
                                        NAMA FILE
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-mono text-sm break-all">
                                            {selectedFile.name}
                                        </p>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={() =>
                                                copyToClipboard(
                                                    selectedFile.name,
                                                )
                                            }
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground">
                                        UKURAN
                                    </p>
                                    <p className="text-sm">
                                        {formatFileSize(selectedFile.size)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground">
                                        TIPE FILE
                                    </p>
                                    <p className="text-sm">
                                        {selectedFile.mime_type || '-'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground">
                                        TERAKHIR DIUBAH
                                    </p>
                                    <p className="text-sm">
                                        {selectedFile.last_modified || '-'}
                                    </p>
                                </div>

                                <div className="md:col-span-2">
                                    <p className="text-xs font-semibold text-muted-foreground">
                                        PATH
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 rounded bg-muted p-2 text-xs break-all">
                                            {selectedFile.path}
                                        </code>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            onClick={() =>
                                                copyToClipboard(
                                                    selectedFile.path,
                                                )
                                            }
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {selectedFile.url && (
                                    <div className="md:col-span-2">
                                        <p className="text-xs font-semibold text-muted-foreground">
                                            URL
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 rounded bg-muted p-2 text-xs break-all">
                                                {selectedFile.url}
                                            </code>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="outline"
                                                onClick={() =>
                                                    copyToClipboard(
                                                        selectedFile.url || '',
                                                    )
                                                }
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {selectedFile && (
                        <DialogFooter className="gap-2 pt-4">
                            {selectedFile.url && (
                                <a href={selectedFile.url} download>
                                    <Button type="button" variant="outline">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                    </Button>
                                </a>
                            )}
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => setIsDeleting(true)}
                            >
                                Hapus Permanen
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus file permanen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            File ini akan dihapus langsung dari storage dan
                            tidak bisa dikembalikan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteFile}>
                            Hapus Permanen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <MediaLibraryUploadModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                items={storageItems}
                currentPath={currentPath}
                onOpenFolder={openFolder}
                onSelectFile={setSelectedFile}
            />
        </>
    );
}

/**
 * ✅ CONSISTENT LAYOUT (like Customer, Language, Media)
 */
Index.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Media Library', href: '/dashboard/media' },
    ],
};
