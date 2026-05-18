import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

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
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import AppLayout from '@/layouts/app-layout';

import type { LaravelPagination } from '@/types/LaravelPagination';

interface Post {
    id: number;
    title: string;
    status: string;
    author?: {
        name: string;
    };
}

interface Props {
    posts: LaravelPagination<Post>;
    filters: {
        search?: string;
        status?: string;
    };
}

export default function Index({ posts, filters }: Props) {
    /**
     * FORM FILTER
     */
    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        status: filters.status || 'publish',
    });

    const [deletingId, setDeletingId] = useState<number | null>(null);

    /**
     * APPLY FILTER
     */
    const applyFilter = () => {
        get('/dashboard/posts', {
            preserveState: true,
            preserveScroll: true,
        });
    };

    /**
     * DELETE
     */
    const handleDelete = () => {
        if (!deletingId) {
            return;
        }

        router.delete(`/dashboard/posts/${deletingId}`, {
            preserveScroll: true,
            onStart: () => toast.loading('Deleting...', { id: 'delete' }),
            onSuccess: () =>
                toast.success('Deleted successfully!', { id: 'delete' }),
            onError: () => toast.error('Failed to delete!', { id: 'delete' }),
            onFinish: () => setDeletingId(null),
        });
    };

    /**
     * TABLE
     */
    const columns = [
        {
            label: 'ID',
            render: (row: Post) => row.id,
        },
        {
            label: 'Title',
            render: (row: Post) => row.title,
        },
        {
            label: 'Author',
            render: (row: Post) => row.author?.name ?? '-',
        },
        {
            label: 'Status',
            render: (row: Post) => (
                <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                        row.status === 'publish'
                            ? 'bg-green-100 text-green-700'
                            : row.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                    }`}
                >
                    {row.status}
                </span>
            ),
        },
        {
            label: 'Action',
            render: (row: Post) => (
                <div className="flex gap-2">
                    <Link href={`/dashboard/posts/${row.id}/edit`}>
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
                                    This action will move post to trash.
                                </AlertDialogDescription>
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

    const statusFilters = ['publish', 'draft', 'trash', 'all'];

    return (
        <>
            <Head title="Posts" />

            <div className="container mx-auto space-y-6 px-6 py-10">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Posts</h1>
                        <p className="text-gray-500">Manage your posts data</p>
                    </div>

                    <Link href="/dashboard/posts/create">
                        <Button>Add Post</Button>
                    </Link>
                </div>

                {/* FILTER */}
                <div className="space-y-3">
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

                    {/* STATUS FILTER */}
                    <div className="flex gap-2">
                        {statusFilters.map((status) => (
                            <Button
                                key={status}
                                type="button"
                                size="sm"
                                variant={
                                    data.status === status
                                        ? 'default'
                                        : 'outline'
                                }
                                onClick={() => {
                                    setData('status', status);
                                    setTimeout(applyFilter, 50);
                                }}
                            >
                                {status.toUpperCase()}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* TABLE */}
                <div className="rounded-xl bg-white p-6 shadow">
                    <DataTable<Post> data={posts.data} columns={columns} />
                </div>

                {/* PAGINATION */}
                <div className="flex gap-2">
                    {posts.links.map((link, i) => (
                        <button
                            key={i}
                            dangerouslySetInnerHTML={{ __html: link.label }}
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
 * LAYOUT
 */
Index.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Posts', href: '/dashboard/posts' }]}>
        {page}
    </AppLayout>
);
