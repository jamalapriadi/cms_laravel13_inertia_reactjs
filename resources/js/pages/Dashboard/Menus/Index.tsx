import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

import type { LaravelPagination } from '@/types/LaravelPagination';

/**
 * TYPE
 */
interface Menu {
    id: number;
    name: string;
    slug: string;
    created_at: string;
}

interface Props {
    menus: LaravelPagination<Menu>;
    filters: {
        search?: string;
    };
}

export default function Index({ menus, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    /**
     * FILTER
     */
    const applyFilter = () => {
        router.get(
            '/dashboard/menus',
            { search },
            { preserveState: true, replace: true },
        );
    };

    /**
     * DELETE
     */
    const handleDelete = () => {
        if (!deletingId) {
            return;
        }

        router.delete(`/dashboard/menus/${deletingId}`, {
            onFinish: () => setDeletingId(null),
        });
    };

    /**
     * TABLE COLUMNS
     */
    const columns = [
        {
            label: 'ID',
            render: (row: Menu) => row.id,
        },
        {
            label: 'Name',
            render: (row: Menu) => row.name,
        },
        {
            label: 'Slug',
            render: (row: Menu) => (
                <span className="text-sm text-muted-foreground">
                    {row.slug}
                </span>
            ),
        },
        {
            label: 'Created',
            render: (row: Menu) => (
                <span className="text-sm">
                    {new Date(row.created_at).toLocaleDateString()}
                </span>
            ),
        },
        {
            label: 'Action',
            render: (row: Menu) => (
                <div className="flex gap-2">
                    <Link href={`/dashboard/menus/${row.id}/edit`}>
                        <Button size="sm" variant="secondary">
                            Builder
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
        <>
            <Head title="Menus" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Menus</h1>
                        <p className="text-muted-foreground">Manage navigation menus</p>
                    </div>

                    <Link href="/dashboard/menus/create">
                        <Button>Add Menu</Button>
                    </Link>
                </div>

                <hr />

                {/* FILTER */}
                <div className="flex gap-3">
                    <Input
                        placeholder="Search menu..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <Button onClick={applyFilter}>Apply</Button>
                </div>

                {/* TABLE */}
                <DataTable<Menu> data={menus.data} columns={columns} />

                {/* PAGINATION */}
                <div className="flex flex-wrap gap-2">
                    {menus.links.map((link, i) => (
                        <button
                            key={i}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            disabled={!link.url}
                            onClick={() => link.url && router.visit(link.url)}
                            className={`rounded px-3 py-1 text-sm ${
                                link.active
                                    ? 'bg-primary text-white'
                                    : 'hover:bg-muted'
                            } ${!link.url && 'opacity-50'}`}
                        />
                    ))}
                </div>
            </div>

            {/* GLOBAL DELETE DIALOG */}
            <AlertDialog
                open={!!deletingId}
                onOpenChange={() => setDeletingId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this menu.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

/**
 * ✅ CONSISTENT LAYOUT
 */
Index.layout = {
    breadcrumbs: [{ title: 'Menus', href: '/dashboard/menus' }],
};
