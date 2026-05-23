import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpRight, Edit, Eye, Plus, Trash } from 'lucide-react';
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

interface SupplierReturn {
    id: string;
    return_number: string;
    return_date: string;
    status: 'pending' | 'completed' | 'cancelled';
    items_count: number;
    supplier?: { name: string } | null;
}

interface Props {
    returns: LaravelPagination<SupplierReturn>;
    filters: {
        search?: string;
        status?: string;
    };
}

const statusClass = (status: SupplierReturn['status']) =>
    ({
        pending:
            'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
        completed:
            'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
        cancelled:
            'border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300',
    })[status];

export default function Index({ returns, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const applyFilter = () => {
        router.get(
            '/dashboard/ecommerce/supplier-returns',
            { search, status },
            { preserveState: true, replace: true },
        );
    };

    const clearFilter = () => {
        setSearch('');
        setStatus('');
        router.get(
            '/dashboard/ecommerce/supplier-returns',
            {},
            { replace: true },
        );
    };

    const handleDelete = () => {
        if (!deletingId) {
            return;
        }

        router.delete(`/dashboard/ecommerce/supplier-returns/${deletingId}`, {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    };

    const columns = [
        {
            label: 'Nomor Retur',
            render: (row: SupplierReturn) => (
                <span className="font-mono text-sm font-semibold text-primary">
                    {row.return_number}
                </span>
            ),
        },
        {
            label: 'Supplier',
            render: (row: SupplierReturn) => (
                <span className="font-medium">{row.supplier?.name ?? '-'}</span>
            ),
        },
        {
            label: 'Tanggal',
            render: (row: SupplierReturn) => (
                <span className="text-sm">
                    {new Date(row.return_date).toLocaleDateString('id-ID')}
                </span>
            ),
        },
        {
            label: 'Item',
            render: (row: SupplierReturn) => (
                <span className="text-sm font-semibold">{row.items_count}</span>
            ),
        },
        {
            label: 'Status',
            render: (row: SupplierReturn) => (
                <span
                    className={`inline-flex rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase ${statusClass(row.status)}`}
                >
                    {row.status}
                </span>
            ),
        },
        {
            label: 'Action',
            render: (row: SupplierReturn) => (
                <div className="flex gap-2">
                    <Link
                        href={`/dashboard/ecommerce/supplier-returns/${row.id}`}
                    >
                        <Button size="sm" variant="secondary" title="Detail">
                            <Eye className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                    {row.status === 'pending' && (
                        <>
                            <Link
                                href={`/dashboard/ecommerce/supplier-returns/${row.id}/edit`}
                            >
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    title="Edit"
                                >
                                    <Edit className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                            <Button
                                size="sm"
                                variant="destructive"
                                title="Delete"
                                onClick={() => setDeletingId(row.id)}
                            >
                                <Trash className="h-3.5 w-3.5" />
                            </Button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Retur Barang" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                            <ArrowUpRight className="h-6 w-6 text-primary" />
                            Retur Barang
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Kelola barang rusak yang dikembalikan ke supplier.
                        </p>
                    </div>

                    <Link href="/dashboard/ecommerce/supplier-returns/create">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Tambah Retur
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Input
                        className="max-w-xs"
                        placeholder="Cari nomor retur atau supplier..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onKeyDown={(event) =>
                            event.key === 'Enter' && applyFilter()
                        }
                    />
                    <select
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                    >
                        <option value="">Semua Status</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <Button onClick={applyFilter}>Filter</Button>
                    <Button variant="outline" onClick={clearFilter}>
                        Clear
                    </Button>
                </div>

                <DataTable<SupplierReturn>
                    data={returns.data}
                    columns={columns}
                />

                <div className="flex flex-wrap gap-2">
                    {returns.links.map((link, index) => (
                        <button
                            key={index}
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
                        <AlertDialogTitle>Hapus retur barang?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Retur yang masih pending akan dihapus dan status
                            stok unit dikembalikan menjadi available.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
