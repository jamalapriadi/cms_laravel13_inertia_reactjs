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
interface Category {
    id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    sort_order: number;
    show_home: boolean;
    is_publish: boolean;
    created_at: string;
    parent?: {
        id: string;
        name: string;
    };
}

interface Props {
    categories: LaravelPagination<Category>;

    filters: {
        search?: string;
    };
}

export default function Index({ categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const [deletingId, setDeletingId] = useState<string | null>(null);

    /**
     * FILTER
     */
    const applyFilter = () => {
        router.get(
            '/dashboard/ecommerce/categories',
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

        router.delete(`/dashboard/ecommerce/categories/${deletingId}`, {
            onFinish: () => setDeletingId(null),
        });
    };

    /**
     * TABLE COLUMNS
     */
    const columns = [
        {
            label: 'Name',
            render: (row: Category) => (
                <span className="font-medium">{row.name}</span>
            ),
        },

        {
            label: 'Slug',
            render: (row: Category) => (
                <span className="text-muted-foreground">{row.slug}</span>
            ),
        },

        {
            label: 'Parent Category',
            render: (row: Category) => (
                <span className="text-sm">{row.parent?.name || '-'}</span>
            ),
        },
        
        {
            label: 'Sort Order',
            render: (row: Category) => (
                <span className="text-sm">{row.sort_order}</span>
            ),
        },

        {
            label: 'Show Home',
            render: (row: Category) => (
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.show_home
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                            : 'bg-muted/50 text-foreground'
                    }`}
                >
                    {row.show_home ? 'Yes' : 'No'}
                </span>
            ),
        },

        {
            label: 'Status',
            render: (row: Category) => (
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.is_publish
                            ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                    }`}
                >
                    {row.is_publish ? 'Published' : 'Draft'}
                </span>
            ),
        },

        {
            label: 'Action',
            render: (row: Category) => (
                <div className="flex gap-2">
                    <Link href={`/dashboard/ecommerce/categories/${row.id}/edit`}>
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
            <Head title="Product Categories" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Product Categories</h1>

                        <p className="text-muted-foreground">
                            List of product categories
                        </p>
                    </div>

                    <Link href="/dashboard/ecommerce/categories/create">
                        <Button>Add Category</Button>
                    </Link>
                </div>

                <hr />

                {/* FILTER */}
                <div className="flex gap-3">
                    <Input
                        placeholder="Search category name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                    />

                    <Button onClick={applyFilter}>Apply</Button>
                </div>

                {/* TABLE */}
                <DataTable<Category> data={categories.data} columns={columns} />

                {/* PAGINATION */}
                <div className="flex flex-wrap gap-2">
                    {categories.links.map((link, i) => (
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
                        <AlertDialogTitle>Delete Category?</AlertDialogTitle>

                        <AlertDialogDescription>
                            This action cannot be undone. The selected category
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
