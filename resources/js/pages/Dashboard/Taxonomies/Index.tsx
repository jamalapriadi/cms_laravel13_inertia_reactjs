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

interface TaxonomyItem {
    id: number;
    description: string;
    count: number;
    term: {
        name: string;
        slug: string;
    };
}

interface Props {
    taxonomy: string;
    taxonomies: LaravelPagination<TaxonomyItem>;
    filters: {
        search?: string;
    };
}

export default function Index({ taxonomy, taxonomies, filters }: Props) {
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
    });

    const [deletingId, setDeletingId] = useState<number | null>(null);

    /**
     * ✅ TITLE
     */
    const getTitle = () => {
        switch (taxonomy) {
            case 'categories':
                return 'Categories';
            case 'tags':
                return 'Tags';
            default:
                return 'Taxonomies';
        }
    };

    const title = getTitle();

    /**
     * ✅ FILTER
     */
    const applyFilter = () => {
        get(`/dashboard/taxonomies/${taxonomy}`, {
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

        destroy(`/dashboard/taxonomies/${taxonomy}/${deletingId}`, {
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
            render: (row: TaxonomyItem) => row.term.name,
        },
        {
            label: 'Slug',
            render: (row: TaxonomyItem) => row.term.slug,
        },
        {
            label: 'Count',
            render: (row: TaxonomyItem) => row.count,
        },
        {
            label: 'Action',
            render: (row: TaxonomyItem) => (
                <div className="flex gap-2">
                    <Link
                        href={`/dashboard/taxonomies/${taxonomy}/${row.id}/edit`}
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
            <Head title={title} />

            <div className="container mx-auto space-y-6 px-6 py-10">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{title}</h1>
                        <p className="text-gray-500">
                            Manage your taxonomy data
                        </p>
                    </div>

                    <Link href={`/dashboard/taxonomies/${taxonomy}/create`}>
                        <Button>Add New</Button>
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
                    <DataTable data={taxonomies.data} columns={columns} />
                </div>

                {/* PAGINATION */}
                <div className="flex gap-2">
                    {taxonomies.links.map((link, i) => (
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
                title: 'Taxonomies',
                href: '/dashboard/taxonomies/categories', // default fallback
            },
        ]}
    >
        {page}
    </AppLayout>
);
