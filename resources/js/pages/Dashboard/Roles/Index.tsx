import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/management-layout';
import type { BreadcrumbItem } from '@/types';
import type { LaravelPagination } from '@/types/LaravelPagination';
import { Button } from '@/components/ui/button';
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
import { DataTable } from '@/components/DataTable';
import { toast } from 'sonner';

interface RoleItem {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    permissions_count: number; // 🔥 tambahkan ini
}

interface Props {
    roles: LaravelPagination<RoleItem>;
    filters: {
        search?: string;
    };
}

export default function Index({ roles, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Roles',
            href: '/dashboard/roles',
        },
    ];

    function applyFilter() {
        router.get('/dashboard/roles', { search }, { preserveState: true });
    }

    const handleDelete = () => {
        if (!deletingId) return;

        const toastId = toast.loading('Deleting role...');

        router.delete(`/dashboard/roles/${deletingId}`, {
            preserveScroll: true,

            onSuccess: () => {
                toast.success('Role deleted successfully!', {
                    id: toastId,
                });
            },

            onError: () => {
                toast.error('Failed to delete role!', {
                    id: toastId,
                });
            },

            onFinish: () => {
                setDeletingId(null);
            },
        });
    };

    const columns: {
        label: string;
        render: (row: RoleItem) => React.ReactNode;
    }[] = [
        {
            label: 'Name',
            render: (row) => row.name,
        },
        {
            label: 'Guard',
            render: (row) => row.guard_name,
        },
        {
            label: 'Permissions',
            render: (row) => (
                <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        row.permissions_count > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                    }`}
                >
                    {row.permissions_count}
                </span>
            ),
        },
        {
            label: 'Created At',
            render: (row) => new Date(row.created_at).toLocaleDateString(),
        },
        {
            label: 'Action',
            render: (row) => (
                <div className="flex gap-2">
                    <Link href={`/dashboard/roles/${row.id}/edit`}>
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
                                    This action cannot be undone.
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />

            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Roles</h1>

                    <Link href="/dashboard/roles/create">
                        <Button>Add New Role</Button>
                    </Link>
                </div>

                {/* FILTER */}
                <div className="flex gap-3">
                    <input
                        className="rounded border px-3 py-2"
                        placeholder="Search role..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <Button onClick={applyFilter}>Apply</Button>
                </div>

                {/* TABLE */}
                <DataTable<RoleItem> data={roles.data} columns={columns} />

                {/* PAGINATION */}
                <div className="flex flex-wrap gap-2">
                    {roles.links.map((link, i) => (
                        <button
                            key={i}
                            dangerouslySetInnerHTML={{
                                __html: link.label,
                            }}
                            disabled={!link.url}
                            onClick={() => link.url && router.visit(link.url)}
                            className={`rounded border px-3 py-1 ${
                                link.active ? 'bg-primary text-white' : ''
                            }`}
                        />
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
