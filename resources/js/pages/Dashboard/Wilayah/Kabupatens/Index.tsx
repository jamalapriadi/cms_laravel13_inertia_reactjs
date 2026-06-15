import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
// ✅ FIXED

import AppLayout from '@/layouts/wilayah-layout';

import type { Provinsi } from '@/types/provinsi';
import type { Kabupaten } from '@/types/kabupaten';
import type { LaravelPagination } from '@/types/LaravelPagination';

interface Props {
    kabupatens: LaravelPagination<Kabupaten>;
    provinces: Provinsi[];
    filters: {
        search?: string;
        province_id?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Kabupatens', href: '/my-admin/dashboard/kabupatens' },
];

export default function Index({ kabupatens, provinces, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [provinceId, setProvinceId] = useState(filters.province_id || '');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    function applyFilter() {
        router.get(
            '/my-admin/dashboard/kabupatens',
            { search, province_id: provinceId },
            { preserveState: true },
        );
    }

    const handleDelete = () => {
        const toastId = toast.loading('Deleting...');

        router.delete(`/my-admin/dashboard/kabupatens/${deletingId}`, {
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

    // ✅ FIXED COLUMN FORMAT
    const columns: {
        label: string;
        render: (row: Kabupaten) => React.ReactNode;
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
            label: 'Province',
            render: (row) => row.province?.name,
        },
        {
            label: 'Action',
            render: (row) => (
                <div className="flex gap-2">
                    <Link
                        href={`/my-admin/dashboard/kabupatens/${row.id}/edit`}
                    >
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
            <Head title="Kabupatens" />

            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Kabupatens</h1>
                    <Link href="/my-admin/dashboard/kabupatens/create">
                        <Button>Add Kabupaten</Button>
                    </Link>
                </div>

                {/* FILTERS */}
                <div className="flex gap-3">
                    <input
                        className="rounded border px-3 py-2"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <select
                        className="rounded border px-3 py-2"
                        value={provinceId}
                        onChange={(e) => setProvinceId(e.target.value)}
                    >
                        <option value="">All Province</option>
                        {provinces.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>

                    <Button onClick={applyFilter}>Apply</Button>
                </div>

                {/* TABLE */}
                <DataTable<Kabupaten>
                    data={kabupatens.data}
                    columns={columns}
                />

                {/* PAGINATION */}
                <div className="flex gap-2">
                    {kabupatens.links.map((link, i) => (
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
