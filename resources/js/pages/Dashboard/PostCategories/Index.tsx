import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import AppLayout from '@/layouts/app-layout';

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
import type { LaravelPagination } from '@/types/LaravelPagination';

interface Category {
    id: string;
    category_name: string;
    slug: string;
    description: string;
    parent?: {
        id: string;
        category_name: string;
    };
}

interface Props {
    categories: LaravelPagination<Category>;
    parents: Category[];
    filters: {
        search?: string;
        parent_id?: string;
    };
}

export default function Index({ categories, parents, filters }: Props) {
    console.log(parents);
    /**
     * ✅ FORM (CONSISTENT)
     */
    const {
        data,
        setData,
        get,
        delete: destroy,
        processing,
    } = useForm({
        search: filters.search || '',
        parent_id: filters.parent_id || '',
    });

    const [deletingId, setDeletingId] = useState<string | null>(null);

    /**
     * ✅ FILTER
     */
    const applyFilter = () => {
        get('/dashboard/post-categories', {
            preserveState: true,
            preserveScroll: true,
        });
    };

    /**
     * ✅ DELETE
     */
    const handleDelete = () => {
        if (!deletingId) {
            return;
        }

        destroy(`/dashboard/post-categories/${deletingId}`, {
            preserveScroll: true,

            onStart: () => toast.loading('Deleting...', { id: 'delete' }),
            onSuccess: () =>
                toast.success('Deleted successfully!', { id: 'delete' }),
            onError: () => toast.error('Failed to delete!', { id: 'delete' }),

            onFinish: () => setDeletingId(null),
        });
    };

    /**
     * ✅ TABLE COLUMNS
     */
    const columns = [
        {
            label: 'Name',
            render: (row: Category) => row.category_name,
        },
        {
            label: 'Slug',
            render: (row: Category) => row.slug,
        },
        {
            label: 'Parent',
            render: (row: Category) => row.parent?.category_name ?? '-',
        },
        {
            label: 'Action',
            render: (row: Category) => (
                <div className="flex gap-2">
                    <Link href={`/dashboard/post-categories/${row.id}/edit`}>
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
        <>
            <Head title="Post Categories" />

            <div className="container mx-auto space-y-6 px-6 py-10">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Post Categories</h1>
                        <p className="text-gray-500">
                            Manage your category structure
                        </p>
                    </div>

                    <Link href="/dashboard/post-categories/create">
                        <Button>Add Category</Button>
                    </Link>
                </div>

                {/* FILTER */}
                <div className="flex gap-3">
                    <Input
                        placeholder="Search..."
                        value={data.search}
                        onChange={(e) => setData('search', e.target.value)}
                    />

                    <Button onClick={applyFilter} disabled={processing}>
                        Apply
                    </Button>
                </div>

                {/* TABLE */}
                <div className="rounded-xl bg-white p-6 shadow">
                    <DataTable<Category>
                        data={categories.data}
                        columns={columns}
                    />
                </div>

                {/* PAGINATION */}
                <div className="flex gap-2">
                    {categories.links.map((link, i) => (
                        <button
                            key={i}
                            dangerouslySetInnerHTML={{
                                __html: link.label,
                            }}
                            disabled={!link.url}
                            onClick={() => link.url && router.visit(link.url)}
                            className={`rounded border px-3 py-1 ${
                                link.active
                                    ? 'bg-primary text-white'
                                    : 'bg-white'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}

/**
 * ✅ CONSISTENT LAYOUT
 */
Index.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            {
                title: 'Post Categories',
                href: '/dashboard/post-categories',
            },
        ]}
    >
        {page}
    </AppLayout>
);
