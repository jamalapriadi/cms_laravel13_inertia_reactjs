import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Edit, Eye, Plus, Trash, ArrowDownLeft } from 'lucide-react';

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

interface Supplier {
    id: string;
    name: string;
}

interface IncomingGoods {
    id: string;
    invoice_number: string;
    transaction_date: string;
    total_amount: number;
    status: 'pending' | 'completed' | 'cancelled';
    note?: string | null;
    supplier: Supplier;
    creator?: {
        name: string;
    } | null;
}

interface Props {
    incomingGoods: LaravelPagination<IncomingGoods>;
    filters: {
        search?: string;
        status?: string;
    };
}

export default function Index({ incomingGoods, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const applyFilter = () => {
        router.get(
            '/dashboard/ecommerce/incoming-goods',
            { search, status },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearFilter = () => {
        setSearch('');
        setStatus('');
        router.get('/dashboard/ecommerce/incoming-goods', {}, { replace: true });
    };

    const handleDelete = () => {
        if (!deletingId) {
            return;
        }

        router.delete(`/dashboard/ecommerce/incoming-goods/${deletingId}`, {
            onFinish: () => setDeletingId(null),
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const statusBadgeClass = (status: IncomingGoods['status']) => {
        return {
            pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/60',
            completed: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 border-green-200 dark:border-green-900/60',
            cancelled: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-900/60',
        }[status];
    };

    const columns = [
        {
            label: 'Invoice Number',
            render: (row: IncomingGoods) => (
                <span className="font-mono font-semibold text-sm text-primary">
                    {row.invoice_number}
                </span>
            ),
        },
        {
            label: 'Supplier',
            render: (row: IncomingGoods) => (
                <span className="font-medium text-foreground">{row.supplier?.name}</span>
            ),
        },
        {
            label: 'Date',
            render: (row: IncomingGoods) => (
                <span className="text-sm">
                    {new Date(row.transaction_date).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </span>
            ),
        },
        {
            label: 'Total Amount',
            render: (row: IncomingGoods) => (
                <span className="font-semibold text-sm">{formatCurrency(row.total_amount)}</span>
            ),
        },
        {
            label: 'Status',
            render: (row: IncomingGoods) => (
                <span
                    className={`inline-flex rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase ${statusBadgeClass(row.status)}`}
                >
                    {row.status}
                </span>
            ),
        },
        {
            label: 'Action',
            render: (row: IncomingGoods) => (
                <div className="flex gap-2">
                    <Link href={`/dashboard/ecommerce/incoming-goods/${row.id}`}>
                        <Button size="sm" variant="secondary" title="View Detail">
                            <Eye className="h-3.5 w-3.5" />
                        </Button>
                    </Link>

                    {row.status === 'pending' && (
                        <>
                            <Link href={`/dashboard/ecommerce/incoming-goods/${row.id}/edit`}>
                                <Button size="sm" variant="secondary" title="Edit">
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
            <Head title="Barang Masuk" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <ArrowDownLeft className="h-6 w-6 text-primary" />
                            Barang Masuk (Purchases)
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Record and track inventory purchased from suppliers
                        </p>
                    </div>

                    <Link href="/dashboard/ecommerce/incoming-goods/create">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Record Purchase
                        </Button>
                    </Link>
                </div>

                <hr className="border-border" />

                {/* FILTERS */}
                <div className="flex flex-wrap gap-3">
                    <Input
                        className="max-w-xs"
                        placeholder="Search invoice number, supplier..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                    />

                    <select
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <Button onClick={applyFilter}>Apply Filter</Button>
                    <Button variant="outline" onClick={clearFilter}>
                        Clear
                    </Button>
                </div>

                {/* TABLE */}
                <DataTable<IncomingGoods> data={incomingGoods.data} columns={columns} />

                {/* PAGINATION */}
                <div className="flex flex-wrap gap-2">
                    {incomingGoods.links.map((link, i) => (
                        <button
                            key={i}
                            dangerouslySetInnerHTML={{
                                __html: link.label,
                            }}
                            disabled={!link.url}
                            onClick={() => link.url && router.visit(link.url)}
                            className={`rounded px-3 py-1 text-sm ${
                                link.active
                                    ? 'bg-primary text-primary-foreground font-semibold'
                                    : 'hover:bg-muted text-muted-foreground'
                            } ${!link.url && 'opacity-50 pointer-events-none'}`}
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
                        <AlertDialogTitle>Delete Purchase Record?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this pending purchase record? This action will permanently remove it along with all draft serial numbers.
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
