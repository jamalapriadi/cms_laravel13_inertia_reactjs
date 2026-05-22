import { Head, Link, router } from '@inertiajs/react';
import {
    LayoutGrid,
    List,
    Search,
    Calendar,
    Trash2,
    Download,
    Image as ImageIcon,
    Plus,
    Monitor,
    Eye,
} from 'lucide-react';

import { useState } from 'react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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

import { LaravelPagination } from '@/types/LaravelPagination';
import { Media } from '@/types/media';
import DetailModal from './Detail';

interface Props {
    media: LaravelPagination<Media>;
    filters: {
        search?: string;
        date?: string;
    };
}

export default function Index({ media, filters }: Props) {
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleFilter = (key: string, value: string) => {
        router.get(
            '/dashboard/media',
            { ...filters, [key]: value },
            { preserveState: true, replace: true },
        );
    };

    const handleDelete = () => {
        if (!deletingId) {
            return;
        }

        const toastId = toast.loading('Menghapus media...');

        router.delete(`/dashboard/media/${deletingId}`, {
            onSuccess: () =>
                toast.success('File berhasil dihapus', { id: toastId }),
            onFinish: () => setDeletingId(null),
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
                            Kelola aset gambar dan dokumen sistem
                        </p>
                    </div>

                    <Link href="/dashboard/media/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Upload Media
                        </Button>
                    </Link>
                </div>

                <hr />

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
                        {media.data.map((item) => (
                            <div
                                key={item.id}
                                className="group relative overflow-hidden rounded-xl border bg-card"
                            >
                                <img
                                    src={`/storage/${item.path}`}
                                    className="h-full w-full object-cover"
                                />

                                {/* overlay */}
                                <div className="absolute inset-0 flex flex-col justify-end bg-black/60 p-3 opacity-0 transition group-hover:opacity-100">
                                    <p className="truncate text-xs font-semibold text-white">
                                        {item.file_name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {item.mime_type}
                                    </p>
                                </div>

                                {/* actions */}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => setSelectedMedia(item)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        onClick={() => setDeletingId(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>

                                    <a href={`/storage/${item.path}`} download>
                                        <Button size="icon" variant="outline">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </a>
                                </div>
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
                                {media.data.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b hover:bg-muted/50"
                                    >
                                        <td className="p-3">
                                            <img
                                                src={`/storage/${item.path}`}
                                                className="h-12 w-16 rounded object-cover"
                                            />
                                        </td>

                                        <td className="p-3">
                                            <div className="font-medium">
                                                {item.file_name}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Monitor className="h-3 w-3" />
                                                {item.width}x{item.height}
                                            </div>
                                        </td>

                                        <td className="p-3 text-sm">
                                            {item.mime_type}
                                        </td>

                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        setSelectedMedia(item)
                                                    }
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        setDeletingId(item.id)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PAGINATION */}
                <div className="flex justify-center gap-2">
                    {media.links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url ?? '#'}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            className={cn(
                                'rounded px-3 py-1 text-sm',
                                link.active
                                    ? 'bg-primary text-white'
                                    : 'hover:bg-muted',
                                !link.url && 'opacity-50',
                            )}
                            preserveState
                        />
                    ))}
                </div>
            </div>

            {/* DELETE DIALOG */}
            <AlertDialog
                open={!!deletingId}
                onOpenChange={() => setDeletingId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Media?</AlertDialogTitle>
                        <AlertDialogDescription>
                            File akan dihapus permanen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* DETAIL MODAL */}
            <DetailModal
                media={selectedMedia}
                isOpen={!!selectedMedia}
                onClose={() => setSelectedMedia(null)}
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
