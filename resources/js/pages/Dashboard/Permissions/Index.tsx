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
import { usePermission } from '@/lib/permissions';

interface PermissionItem {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
}

interface Props {
    permissions: LaravelPagination<PermissionItem>;
    filters: { search?: string };
}

export default function Index({ permissions, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const { hasPermission } = usePermission();
    const canCreate = hasPermission('permissions.create');
    const canEdit = hasPermission('permissions.edit');
    const canDelete = hasPermission('permissions.delete');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Permissions', href: '/my-admin/dashboard/permissions' },
    ];

    function applyFilter() {
        router.get(
            '/my-admin/dashboard/permissions',
            { search },
            { preserveState: true },
        );
    }

    const handleDelete = () => {
        if (!deletingId) return;

        const toastId = toast.loading('Deleting permission...');

        router.delete(`/my-admin/dashboard/permissions/${deletingId}`, {
            onSuccess: () => toast.success('Deleted!', { id: toastId }),
            onError: () => toast.error('Failed!', { id: toastId }),
            onFinish: () => setDeletingId(null),
        });
    };

    const columns = [
        { label: 'Name', render: (row: PermissionItem) => row.name },
        { label: 'Guard', render: (row: PermissionItem) => row.guard_name },
        {
            label: 'Created At',
            render: (row: PermissionItem) =>
                new Date(row.created_at).toLocaleDateString(),
        },
        ...(canEdit || canDelete
            ? [
                  {
                      label: 'Action',
                      render: (row: PermissionItem) => (
                          <div className="flex gap-2">
                              {canEdit && (
                                  <Link
                                      href={`/my-admin/dashboard/permissions/${row.id}/edit`}
                                  >
                                      <Button size="sm" variant="secondary">
                                          Edit
                                      </Button>
                                  </Link>
                              )}

                              {canDelete && (
                                  <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                          <Button
                                              size="sm"
                                              variant="destructive"
                                              onClick={() =>
                                                  setDeletingId(row.id)
                                              }
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
                                              <AlertDialogCancel>
                                                  Cancel
                                              </AlertDialogCancel>
                                              <AlertDialogAction
                                                  onClick={handleDelete}
                                              >
                                                  Delete
                                              </AlertDialogAction>
                                          </AlertDialogFooter>
                                      </AlertDialogContent>
                                  </AlertDialog>
                              )}
                          </div>
                      ),
                  },
              ]
            : []),
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Permissions" />

            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Permissions</h1>
                    {canCreate && (
                        <Link href="/my-admin/dashboard/permissions/create">
                            <Button>Add New Permission</Button>
                        </Link>
                    )}
                </div>

                <div className="flex gap-3">
                    <input
                        className="rounded border px-3 py-2"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button onClick={applyFilter}>Apply</Button>
                </div>

                <DataTable data={permissions.data} columns={columns} />

                <div className="flex flex-wrap gap-2">
                    {permissions.links.map((link, i) => (
                        <button
                            key={i}
                            dangerouslySetInnerHTML={{ __html: link.label }}
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
