import { Head, Link, router } from '@inertiajs/react';
import { Edit, Eye, Plus, Trash, Users } from 'lucide-react';
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

// import AppLayout from '@/layouts/master-data-layout';

import type { LaravelPagination } from '@/types/LaravelPagination';

interface Supplier {
    id: string;
    name: string;
    code: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    is_active: boolean;
    created_at: string;
}

interface Props {
    suppliers: LaravelPagination<Supplier>;
    filters: {
        search?: string;
    };
}

export default function Index({ suppliers, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const applyFilter = () => {
        router.get(
            '/my-admin/dashboard/ecommerce/suppliers',
            { search },
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

        router.delete(`/my-admin/dashboard/ecommerce/suppliers/${deletingId}`, {
            onFinish: () => setDeletingId(null),
        });
    };

    const columns = [
        {
            label: 'Code',
            render: (row: Supplier) => (
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                    {row.code}
                </span>
            ),
        },
        {
            label: 'Name',
            render: (row: Supplier) => (
                <span className="font-medium text-foreground">{row.name}</span>
            ),
        },
        {
            label: 'Phone',
            render: (row: Supplier) => (
                <span className="text-sm">{row.phone || '-'}</span>
            ),
        },
        {
            label: 'Email',
            render: (row: Supplier) => (
                <span className="text-sm">{row.email || '-'}</span>
            ),
        },
        {
            label: 'Status',
            render: (row: Supplier) => (
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
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
            label: 'Action',
            render: (row: Supplier) => (
                <div className="flex gap-2">
                    <Link href={`/my-admin/dashboard/ecommerce/suppliers/${row.id}`}>
                        <Button size="sm" variant="secondary" title="Detail">
                            <Eye className="h-3.5 w-3.5" />
                        </Button>
                    </Link>

                    <Link
                        href={`/my-admin/dashboard/ecommerce/suppliers/${row.id}/edit`}
                    >
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
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Suppliers" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                            <Users className="h-6 w-6 text-primary" />
                            Suppliers
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage supplier master records for inventory
                            purchase
                        </p>
                    </div>

                    <Link href="/my-admin/dashboard/ecommerce/suppliers/create">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Supplier
                        </Button>
                    </Link>
                </div>

                <hr className="border-border" />

                {/* FILTER */}
                <div className="flex max-w-md gap-3">
                    <Input
                        placeholder="Search supplier name, code, phone, email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                    />
                    <Button onClick={applyFilter}>Search</Button>
                </div>

                {/* TABLE */}
                <DataTable<Supplier> data={suppliers.data} columns={columns} />

                {/* PAGINATION */}
                <div className="flex flex-wrap gap-2">
                    {suppliers.links.map((link, i) => (
                        <button
                            key={i}
                            dangerouslySetInnerHTML={{
                                __html: link.label,
                            }}
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

            {/* DELETE DIALOG */}
            <AlertDialog
                open={!!deletingId}
                onOpenChange={() => setDeletingId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Supplier?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this supplier? This
                            action cannot be undone.
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
