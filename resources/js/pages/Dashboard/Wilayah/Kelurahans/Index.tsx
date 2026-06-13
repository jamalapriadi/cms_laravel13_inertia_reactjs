import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/wilayah-layout';

import type { Provinsi } from '@/types/provinsi';
import type { Kabupaten } from '@/types/kabupaten';
import type { Kecamatan } from '@/types/kecamatan';
import type { Kelurahan } from '@/types/kelurahan';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

import { DataTable } from '@/components/DataTable';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { LaravelPagination } from '@/types/LaravelPagination';

interface Props {
    kelurahans: LaravelPagination<Kelurahan>;
    provinsis: Provinsi[];
    filters: {
        provinsi_id?: string;
        kabupaten_id?: string;
        kecamatan_id?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Kelurahans', href: '/my-admin/dashboard/kelurahans' },
];

export default function Index({ kelurahans, provinsis, filters }: Props) {
    const [provinsiId, setProvinsiId] = useState(filters.provinsi_id || '');
    const [kabupatenId, setKabupatenId] = useState(filters.kabupaten_id || '');
    const [kecamatanId, setKecamatanId] = useState(filters.kecamatan_id || '');
    const [kabupatens, setKabupatens] = useState<Kabupaten[]>([]);
    const [kecamatans, setKecamatans] = useState<Kecamatan[]>([]);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    async function fetchKabupaten(id: string) {
        setProvinsiId(id);
        setKabupatenId('');
        setKecamatanId('');
        setKecamatans([]);

        if (!id) {
            setKabupatens([]);
            return;
        }

        const res = await fetch(`/api/kabupaten/${id}`);
        const data = await res.json();
        setKabupatens(data);
    }

    async function fetchKecamatan(id: string) {
        setKabupatenId(id);
        setKecamatanId('');

        if (!id) {
            setKecamatans([]);
            return;
        }

        const res = await fetch(`/api/kecamatan/${id}`);
        const data = await res.json();
        setKecamatans(data);
    }

    function applyFilter() {
        router.get(
            '/my-admin/dashboard/kelurahans',
            {
                provinsi_id: provinsiId,
                kabupaten_id: kabupatenId,
                kecamatan_id: kecamatanId,
            },
            { preserveState: true },
        );
    }

    function handleDelete() {
        if (!deletingId) return;

        router.delete(`/my-admin/dashboard/kelurahans/${deletingId}`, {
            onFinish: () => setDeletingId(null),
        });
    }

    // ✅ TYPE SAFE COLUMN
    const columns: {
        label: string;
        render: (row: Kelurahan) => React.ReactNode;
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
            label: 'Kecamatan',
            render: (row) => row.kecamatan?.name,
        },
        {
            label: 'Kabupaten',
            render: (row) => row.kecamatan?.kabupaten?.name,
        },
        {
            label: 'Provinsi',
            render: (row) => row.kecamatan?.kabupaten?.province?.name,
        },
        {
            label: 'Action',
            render: (row) => (
                <div className="flex gap-2">
                    <Link href={`/my-admin/dashboard/kelurahans/${row.id}/edit`}>
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
            <Head title="Kelurahans" />

            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Kelurahans</h1>
                    <Link href="/my-admin/dashboard/kelurahans/create">
                        <Button>Add Kelurahan</Button>
                    </Link>
                </div>

                {/* FILTERS */}
                <div className="flex flex-wrap gap-3">
                    <select
                        className="rounded border px-3 py-2"
                        value={provinsiId}
                        onChange={(e) => fetchKabupaten(e.target.value)}
                    >
                        <option value="">All Provinsi</option>
                        {provinsis.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="rounded border px-3 py-2"
                        value={kabupatenId}
                        onChange={(e) => fetchKecamatan(e.target.value)}
                    >
                        <option value="">All Kabupaten</option>
                        {kabupatens.map((k) => (
                            <option key={k.id} value={k.id}>
                                {k.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="rounded border px-3 py-2"
                        value={kecamatanId}
                        onChange={(e) => setKecamatanId(e.target.value)}
                    >
                        <option value="">All Kecamatan</option>
                        {kecamatans.map((k) => (
                            <option key={k.id} value={k.id}>
                                {k.name}
                            </option>
                        ))}
                    </select>

                    <Button onClick={applyFilter}>Apply</Button>
                </div>

                {/* TABLE */}
                <DataTable<Kelurahan>
                    data={kelurahans.data}
                    columns={columns}
                />

                {/* PAGINATION */}
                <div className="flex gap-2">
                    {kelurahans.links.map((link, i) => (
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
