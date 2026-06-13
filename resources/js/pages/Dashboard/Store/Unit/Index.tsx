import { Head, Link, router } from '@inertiajs/react';
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

import AppLayout from '@/layouts/master-data-layout';

import type { LaravelPagination } from '@/types/LaravelPagination';

/**
 * TYPE
 */
interface Unit {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    is_active: boolean;
    created_at: string;
}

interface Props {
    units: LaravelPagination<Unit>;

    filters: {
        search?: string;
    };
}

export default function Index({ units, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const [deletingId, setDeletingId] = useState<string | null>(null);

    /**
     * FILTER
     */
    const applyFilter = () => {
        router.get(
            '/my-admin/dashboard/units',
            { search },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    /**
     * DELETE
     */
    const handleDelete = () => {
        if (!deletingId) {
            return;
        }

        router.delete(`/my-admin/dashboard/units/${deletingId}`, {
            onFinish: () => setDeletingId(null),
        });
    };

    /**
     * TABLE COLUMNS
     */
    const columns = [
        {
            label: 'Name',
            render: (row: Unit) => (
                <span className="font-medium">{row.name}</span>
            ),
        },

        {
            label: 'Code',
            render: (row: Unit) => (
                <span className="text-muted-foreground">{row.code}</span>
            ),
        },

        {
            label: 'Description',
            render: (row: Unit) => (
                <span className="text-sm">{row.description || '-'}</span>
            ),
        },

        {
            label: 'Status',
            render: (row: Unit) => (
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
            render: (row: Unit) => (
                <div className="flex gap-2">
                    <Link href={`/my-admin/dashboard/units/${row.id}/edit`}>
                        <Button size="sm" variant="secondary">
                            Edit
                        </Button>
                    </Link>

                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletingId(row.id)}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Units" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Product Units</h1>

                        <p className="text-muted-foreground">
                            Manage product unit/measurement types
                        </p>
                    </div>

                    <Link href="/my-admin/dashboard/units/create">
                        <Button>Add Unit</Button>
                    </Link>
                </div>

                <hr />

                {/* FILTERS */}
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search by name or code..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button onClick={applyFilter}>Search</Button>
                    </div>
                </div>

                {/* TABLE */}
                <div className="rounded-xl bg-card shadow">
                    <DataTable
                        columns={columns}
                        data={units.data}
                    />
                </div>

                {/* PAGINATION */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        Showing {units.from} to {units.to} of {units.total} results
                    </span>

                    <div className="flex gap-2">
                        {units.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`px-3 py-1 rounded border text-sm ${
                                    link.active
                                        ? 'bg-blue-500 text-white border-blue-500'
                                        : 'bg-card text-foreground border-border'
                                } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* DELETE DIALOG */}
            <AlertDialog open={!!deletingId}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Unit</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this unit? This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingId(null)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
