import { Media } from '@/types/media';
import { useMediaUrl } from '@/lib/media';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { router } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
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
import { Download, Trash2, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    media: Media | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function DetailModal({ media, isOpen, onClose }: Props) {
    const mediaPreviewUrl = useMediaUrl(media?.path);
    const [altText, setAltText] = useState(media?.alt || '');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveAlt = () => {
        if (!media) return;

        setIsSaving(true);
        const toastId = toast.loading('Menyimpan...');

        router.put(
            `/my-admin/dashboard/media/${media.id}`,
            { alt: altText },
            {
                onSuccess: () => {
                    toast.success('Alt text berhasil diperbarui', {
                        id: toastId,
                    });
                    onClose();
                },
                onError: () => {
                    toast.error('Gagal memperbarui alt text', { id: toastId });
                },
                onFinish: () => setIsSaving(false),
            },
        );
    };

    const handleDelete = () => {
        if (!media) return;

        const toastId = toast.loading('Menghapus media...');

        router.delete(`/my-admin/dashboard/media/${media.id}`, {
            onSuccess: () => {
                toast.success('File berhasil dihapus', { id: toastId });
                onClose();
            },
            onError: () => {
                toast.error('Gagal menghapus file', { id: toastId });
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Disalin ke clipboard');
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '—';
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return (
            Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!media) return null;

    const imageUrl = media.url ?? mediaPreviewUrl ?? '';
    const isImage = media.mime_type.startsWith('image');

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detail Media</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* PREVIEW */}
                        <div className="rounded-lg border bg-muted p-4">
                            {isImage ? (
                                <img
                                    src={imageUrl}
                                    alt={media.alt || media.file_name}
                                    className="max-h-80 w-full object-contain"
                                />
                            ) : (
                                <div className="flex h-80 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/50 bg-muted">
                                    <p className="text-muted-foreground">
                                        File tidak dapat dipratinjau
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* INFO */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* File Name */}
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">
                                    NAMA FILE
                                </label>
                                <div className="flex items-center gap-2">
                                    <p className="font-mono text-sm break-all">
                                        {media.file_name}
                                    </p>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                            copyToClipboard(media.file_name)
                                        }
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* File Size */}
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">
                                    UKURAN
                                </label>
                                <p className="text-sm">
                                    {formatFileSize(media.size ?? undefined)}
                                </p>
                            </div>

                            {/* MIME Type */}
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">
                                    TIPE FILE
                                </label>
                                <p className="text-sm">{media.mime_type}</p>
                            </div>

                            {/* Dimensions */}
                            {media.width && media.height && (
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">
                                        DIMENSI
                                    </label>
                                    <p className="text-sm">
                                        {media.width} × {media.height} px
                                    </p>
                                </div>
                            )}

                            {/* Upload Date */}
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">
                                    TANGGAL UPLOAD
                                </label>
                                <p className="text-sm">
                                    {formatDate(media.created_at)}
                                </p>
                            </div>

                            {/* Disk */}
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">
                                    PENYIMPANAN
                                </label>
                                <p className="text-sm capitalize">
                                    {media.disk}
                                </p>
                            </div>

                            {/* URL */}
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-muted-foreground">
                                    URL
                                </label>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 truncate rounded bg-muted p-2 text-xs">
                                        {imageUrl}
                                    </code>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            copyToClipboard(imageUrl)
                                        }
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* ALT TEXT */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">
                                ALT TEXT
                            </label>
                            <Input
                                value={altText}
                                onChange={(e) => setAltText(e.target.value)}
                                placeholder="Deskripsi gambar untuk aksesibilitas..."
                                className="text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Gunakan alt text yang deskriptif untuk
                                aksesibilitas dan SEO.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 pt-6">
                        <a href={imageUrl} download className="flex-1">
                            <Button className="w-full" variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        </a>

                        <Button
                            variant="destructive"
                            onClick={() => setIsDeleting(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                        </Button>

                        <Button
                            onClick={handleSaveAlt}
                            disabled={isSaving || altText === (media.alt || '')}
                        >
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION */}
            <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Media?</AlertDialogTitle>
                        <AlertDialogDescription>
                            File{' '}
                            <span className="font-semibold">
                                {media.file_name}
                            </span>{' '}
                            akan dihapus permanen dan tidak dapat dipulihkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
