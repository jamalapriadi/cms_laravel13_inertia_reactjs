import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { DataTable } from '@/components/DataTable';
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
import { Input } from '@/components/ui/input';
import type { LaravelPagination } from '@/types/LaravelPagination';

interface BannerSlide {
    id: string;
    title: string | null;
    subtitle: string | null;
    image_url: string | null;
    type: string;
    position: string;
    is_active: boolean;
    sort_order: number;
    start_at: string | null;
    end_at: string | null;
}

interface OptionItem {
    value: string;
    label: string;
}

interface Props {
    slides: LaravelPagination<BannerSlide>;
    typeOptions: OptionItem[];
    positionOptions: OptionItem[];
    filters: {
        search: string;
        type: string;
        position: string;
        is_active: boolean | null;
    };
}

export default function Index({
    slides,
    filters,
    typeOptions,
    positionOptions,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || '');
    const [position, setPosition] = useState(filters.position || '');
    const [isActive, setIsActive] = useState(
        filters.is_active === null ? '' : filters.is_active ? '1' : '0',
    );
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const applyFilter = () => {
        router.get(
            '/my-admin/dashboard/ecommerce/banner-slides',
            {
                search,
                type: type || undefined,
                position: position || undefined,
                is_active: isActive || undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDelete = () => {
        if (!deletingId) {
            return;
        }

        router.delete(`/my-admin/dashboard/ecommerce/banner-slides/${deletingId}`, {
            onFinish: () => setDeletingId(null),
        });
    };

    const columns = [
        {
            label: 'Image',
            render: (row: BannerSlide) =>
                row.image_url ? (
                    <img
                        src={row.image_url}
                        alt={row.title || 'banner'}
                        className="h-14 w-28 rounded-md border object-cover"
                    />
                ) : (
                    <div className="flex h-14 w-28 items-center justify-center rounded-md border text-xs text-muted-foreground">
                        N/A
                    </div>
                ),
        },
        {
            label: 'Title',
            render: (row: BannerSlide) => (
                <div>
                    <p className="font-medium">{row.title || '-'}</p>
                    <p className="text-xs text-muted-foreground">
                        {row.subtitle || '-'}
                    </p>
                </div>
            ),
        },
        {
            label: 'Type',
            render: (row: BannerSlide) => row.type,
        },
        {
            label: 'Position',
            render: (row: BannerSlide) => row.position,
        },
        {
            label: 'Active',
            render: (row: BannerSlide) => (
                <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                    }`}
                >
                    {row.is_active ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            label: 'Period',
            render: (row: BannerSlide) => (
                <span className="text-xs text-muted-foreground">
                    {formatPeriod(row.start_at, row.end_at)}
                </span>
            ),
        },
        {
            label: 'Sort',
            render: (row: BannerSlide) => (
                <span className="font-mono text-xs">{row.sort_order}</span>
            ),
        },
        {
            label: 'Actions',
            render: (row: BannerSlide) => (
                <div className="flex gap-2">
                    <Link
                        href={`/my-admin/dashboard/ecommerce/banner-slides/${row.id}/edit`}
                    >
                        <Button size="sm" variant="secondary">
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletingId(row.id)}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Banner Slides" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Banner Slides
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage homepage banner slides.
                        </p>
                    </div>

                    <Link href="/my-admin/dashboard/ecommerce/banner-slides/create">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Banner
                        </Button>
                    </Link>
                </div>

                <hr className="border-border" />

                <div className="grid gap-3 md:grid-cols-5">
                    <Input
                        className="md:col-span-2"
                        placeholder="Search title or subtitle..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onKeyDown={(event) =>
                            event.key === 'Enter' && applyFilter()
                        }
                    />
                    <select
                        value={type}
                        onChange={(event) => setType(event.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">All Type</option>
                        {typeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <select
                        value={position}
                        onChange={(event) => setPosition(event.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">All Position</option>
                        {positionOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <select
                        value={isActive}
                        onChange={(event) => setIsActive(event.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">All Status</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>

                <div>
                    <Button onClick={applyFilter}>Apply Filter</Button>
                </div>

                <DataTable<BannerSlide> data={slides.data} columns={columns} />

                <div className="flex flex-wrap gap-2">
                    {slides.links.map((link, index) => (
                        <button
                            key={`${link.label}-${index}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            disabled={!link.url}
                            onClick={() => link.url && router.visit(link.url)}
                            className={`rounded px-3 py-1 text-sm ${
                                link.active
                                    ? 'bg-primary font-semibold text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted'
                            } ${!link.url && 'pointer-events-none opacity-50'}`}
                        />
                    ))}
                </div>
            </div>

            <AlertDialog
                open={!!deletingId}
                onOpenChange={() => setDeletingId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete banner slide?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function formatPeriod(startAt: string | null, endAt: string | null): string {
    if (!startAt && !endAt) {
        return 'Always';
    }

    const startText = startAt
        ? new Date(startAt).toLocaleString('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
          })
        : 'No start';

    const endText = endAt
        ? new Date(endAt).toLocaleString('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
          })
        : 'No end';

    return `${startText} - ${endText}`;
}
