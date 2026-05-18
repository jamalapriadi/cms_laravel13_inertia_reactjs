import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { BreadcrumbItem } from '@/types';
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
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import AppLayout from '@/layouts/wilayah-layout';

import type { Provinsi } from '@/types/provinsi';
import type { LaravelPagination } from '@/types/LaravelPagination';
import { Button } from '@/components/ui/button';

interface Props {
    provinces: LaravelPagination<Provinsi>;
    filters: {
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Provinces', href: '/dashboard/provinces' },
];

export default function Index({ provinces, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    function applyFilter() {
        router.get('/dashboard/provinces', { search }, { preserveState: true });
    }

    const handleDelete = () => {
        const toastId = toast.loading('Deleting...');

        router.delete(`/dashboard/provinces/${deletingId}`, {
            preserveScroll: true,

            onSuccess: () => {
                toast.success('Deleted successfully!', { id: toastId });
            },

            onError: () => {
                toast.error('Failed to delete!', { id: toastId });
            },

            onFinish: () => {
                setDeletingId(null);
            },
        });
    };

    const columns: {
        label: string;
        render: (row: Provinsi) => React.ReactNode;
    }[] = [
        {
            label: 'ID',
            render: (row) => row.id,
        },
        {
            label: 'Name',
            render: (row) => row.name,
        },
        {
            label: 'Action',
            render: (row) => (
                <div className="flex gap-2">
                    <Link href={`/dashboard/provinces/${row.id}/edit`}>
                        <Button size="sm" variant="secondary">
                            Edit
                        </Button>
                    </Link>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeletingId(row.id)}
                            >
                                Delete
                            </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Provinces" />

            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Provinces</h1>
                    <Link href="/dashboard/provinces/create">
                        <Button>Add Province</Button>
                    </Link>
                </div>

                {/* FILTER */}
                <div className="flex gap-3">
                    <input
                        className="rounded border px-3 py-2"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <Button onClick={applyFilter}>Apply</Button>
                </div>

                {/* TABLE */}
                <DataTable<Provinsi> data={provinces.data} columns={columns} />

                {/* PAGINATION */}
                <div className="flex gap-2">
                    {provinces.links.map((link, i) => (
                        <button
                            key={i}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            disabled={!link.url}
                            onClick={() => link.url && router.visit(link.url)}
                            className={`rounded border px-3 py-1 ${
                                link.active ? 'bg-primary text-white' : ''
                            }`}
                        />
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
