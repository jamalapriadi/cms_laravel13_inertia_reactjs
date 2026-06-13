import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import type { BreadcrumbItem } from '@/types';
import { DataTable } from '@/components/DataTable'; // ✅ FIXED IMPORT
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

import type { Kecamatan } from '@/types/kecamatan';
import type { Provinsi } from '@/types/provinsi';
import type { Kabupaten } from '@/types/kabupaten';
import type { LaravelPagination } from '@/types/LaravelPagination';

interface Props {
    kecamatans: LaravelPagination<Kecamatan>;
    provinces: Provinsi[];
    kabupatens: Kabupaten[];
    filters: {
        search?: string;
        province_id?: string;
        kabupaten_id?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Kecamatans', href: '/my-admin/dashboard/kecamatans' },
];

export default function Index({
    kecamatans,
    provinces,
    kabupatens,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [provinceId, setProvinceId] = useState(filters.province_id || '');
    const [kabupatenId, setKabupatenId] = useState(filters.kabupaten_id || '');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    function applyFilter() {
        router.get(
            '/my-admin/dashboard/kecamatans',
            {
                search,
                province_id: provinceId,
                kabupaten_id: kabupatenId,
            },
            { preserveState: true },
        );
    }

    function handleDelete() {
        if (!deletingId) return;

        router.delete(`/my-admin/dashboard/kecamatans/${deletingId}`, {
            onFinish: () => setDeletingId(null),
        });
    }

    const filteredKabupatens = provinceId
        ? kabupatens.filter((k) => String(k.province.id) === provinceId)
        : kabupatens;

    // ✅ FIXED COLUMN STRUCTURE
    const columns: {
        label: string;
        render: (row: Kecamatan) => React.ReactNode;
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
            label: 'Kabupaten',
            render: (row) => row.kabupaten?.name,
        },
        {
            label: 'Province',
            render: (row) => row.kabupaten?.province?.name,
        },
        {
            label: 'Action',
            render: (row) => (
                <div className="flex gap-2">
                    <Link href={`/my-admin/dashboard/kecamatans/${row.id}/edit`}>
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
                                    This action cannot be undone. This will
                                    permanently delete{' '}
                                    <strong>{row.name}</strong>.
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDelete}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Yes, Delete
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
            <Head title="Kecamatans" />

            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Kecamatans</h1>
                    <Link href="/my-admin/dashboard/kecamatans/create">
                        <Button>Add Kecamatan</Button>
                    </Link>
                </div>

                {/* FILTER */}
                <div className="flex flex-wrap gap-3">
                    <input
                        className="rounded border px-3 py-2"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <select
                        className="rounded border px-3 py-2"
                        value={provinceId}
                        onChange={(e) => {
                            setProvinceId(e.target.value);
                            setKabupatenId('');
                        }}
                    >
                        <option value="">All Province</option>
                        {provinces.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="rounded border px-3 py-2"
                        value={kabupatenId}
                        onChange={(e) => setKabupatenId(e.target.value)}
                    >
                        <option value="">All Kabupaten</option>
                        {filteredKabupatens.map((k) => (
                            <option key={k.id} value={k.id}>
                                {k.name}
                            </option>
                        ))}
                    </select>

                    <Button onClick={applyFilter}>Apply</Button>
                </div>

                {/* TABLE */}
                <DataTable<Kecamatan>
                    data={kecamatans.data}
                    columns={columns}
                />

                {/* PAGINATION */}
                <div className="flex flex-wrap gap-2">
                    {kecamatans.links.map((link, i) => (
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
