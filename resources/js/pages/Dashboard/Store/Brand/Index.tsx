import { Head, Link, router } from '@inertiajs/react';
import { Package, Tags } from 'lucide-react';
import { useState } from 'react';
import type { ElementType } from 'react';

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
interface Brand {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    products_count?: number | null;
    is_active: boolean;
    created_at: string;
}

interface Props {
    brands: LaravelPagination<Brand>;
    summary: {
        brands: number;
        products: number;
    };

    filters: {
        search?: string;
    };
}

const formatCount = (value: number | null | undefined) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return '0';
    }

    return Math.trunc(numericValue)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

function SummaryCard({
    title,
    value,
    icon: Icon,
}: {
    title: string;
    value: number;
    icon: ElementType;
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    {title}
                </span>

                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="h-4 w-4" />
                </div>
            </div>

            <p className="mt-4 text-3xl font-extrabold tracking-tight text-foreground">
                {formatCount(value)}
            </p>
        </div>
    );
}

export default function Index({ brands, summary, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const [deletingId, setDeletingId] = useState<string | null>(null);

    /**
     * FILTER
     */
    const applyFilter = () => {
        router.get(
            '/dashboard/brands',
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

        router.delete(`/dashboard/brands/${deletingId}`, {
            onFinish: () => setDeletingId(null),
        });
    };

    /**
     * TABLE COLUMNS
     */
    const columns = [
        {
            label: 'Name',
            render: (row: Brand) => (
                <span className="font-medium">{row.name}</span>
            ),
        },

        {
            label: 'Slug',
            render: (row: Brand) => (
                <span className="text-muted-foreground">{row.slug}</span>
            ),
        },

        {
            label: 'Description',
            render: (row: Brand) => (
                <span className="text-sm">{row.description || '-'}</span>
            ),
        },

        {
            label: 'Total Product',
            render: (row: Brand) => (
                <span className="font-medium">{formatCount(row.products_count)}</span>
            ),
        },

        {
            label: 'Status',
            render: (row: Brand) => (
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
            render: (row: Brand) => (
                <div className="flex gap-2">
                    <Link href={`/dashboard/brands/${row.id}/edit`}>
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
            <Head title="Brands" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Brands</h1>

                        <p className="text-muted-foreground">
                            List of registered brands
                        </p>
                    </div>

                    <Link href="/dashboard/brands/create">
                        <Button>Add Brand</Button>
                    </Link>
                </div>

                <hr />

                <div className="grid gap-4 md:grid-cols-2">
                    <SummaryCard
                        title="Total Brand"
                        value={summary.brands}
                        icon={Tags}
                    />

                    <SummaryCard
                        title="Total Product Dalam Brand"
                        value={summary.products}
                        icon={Package}
                    />
                </div>

                {/* FILTER */}
                <div className="flex gap-3">
                    <Input
                        placeholder="Search brand name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                    />

                    <Button onClick={applyFilter}>Apply</Button>
                </div>

                {/* TABLE */}
                <DataTable<Brand> data={brands.data} columns={columns} />

                {/* PAGINATION */}
                <div className="flex flex-wrap gap-2">
                    {brands.links.map((link, i) => (
                        <button
                            key={i}
                            dangerouslySetInnerHTML={{
                                __html: link.label,
                            }}
                            disabled={!link.url}
                            onClick={() => link.url && router.visit(link.url)}
                            className={`rounded px-3 py-1 text-sm ${
                                link.active
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                            } ${!link.url && 'opacity-50'}`}
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
                        <AlertDialogTitle>Delete Brand?</AlertDialogTitle>

                        <AlertDialogDescription>
                            This action cannot be undone. The selected brand
                            will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>

                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
