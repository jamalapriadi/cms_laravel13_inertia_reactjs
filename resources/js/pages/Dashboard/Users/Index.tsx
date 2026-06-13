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
import { Switch } from '@/components/ui/switch';
import { DataTable } from '@/components/DataTable';
import { toast } from 'sonner';
import { usePermission } from '@/lib/permissions';

interface Role {
    id: number;
    name: string;
}

interface UserItem {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    roles_count: number;
    roles: Role[];
    created_at: string;
}

interface Props {
    users: LaravelPagination<UserItem>;
    roles: Role[];
    filters: {
        search?: string;
        role?: string;
        status?: string;
    };
}

export default function Index({ users, roles, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || '');
    const [status, setStatus] = useState(filters.status || '');
    const [confirmingUser, setConfirmingUser] = useState<UserItem | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const { hasPermission } = usePermission();
    const canCreate = hasPermission('users.create');
    const canEdit = hasPermission('users.edit');
    const canDelete = hasPermission('users.delete');
    const canUpdateStatus = hasPermission('users.update-status');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Users',
            href: '/my-admin/dashboard/users',
        },
    ];

    function applyFilter() {
        router.get(
            '/my-admin/dashboard/users',
            { search, role, status },
            { preserveState: true },
        );
    }

    const handleDelete = () => {
        if (!deletingId) return;

        const toastId = toast.loading('Deleting user...');

        router.delete(`/my-admin/dashboard/users/${deletingId}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('User deleted successfully!', {
                    id: toastId,
                });
            },
            onError: () => {
                toast.error('Failed to delete user!', {
                    id: toastId,
                });
            },
            onFinish: () => {
                setDeletingId(null);
            },
        });
    };

    const handleToggleStatus = (id: number) => {
        const toastId = toast.loading('Updating status...');

        router.patch(
            `/my-admin/dashboard/users/${id}/toggle-status`,
            {},
            {
                preserveScroll: true,

                onSuccess: () => {
                    toast.success('Status updated!', {
                        id: toastId,
                    });
                },

                onError: (errors: Record<string, string>) => {
                    // Jika error dari validation (self deactivate)
                    if (errors.status) {
                        toast.error(errors.status, {
                            id: toastId,
                        });
                    } else {
                        toast.error('Failed to update status!', {
                            id: toastId,
                        });
                    }
                },

                onFinish: () => {
                    // Optional: apapun cleanup
                },
            },
        );
    };

    const columns: {
        label: string;
        render: (row: UserItem) => React.ReactNode;
    }[] = [
        {
            label: 'Name',
            render: (row) => row.name,
        },
        {
            label: 'Email',
            render: (row) => row.email,
        },
        {
            label: 'Roles',
            render: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.roles.length > 0 ? (
                        row.roles.map((r) => (
                            <span
                                key={r.id}
                                className="rounded-full bg-primary/10 px-2 py-1 text-xs"
                            >
                                {r.name}
                            </span>
                        ))
                    ) : (
                        <span className="text-xs text-muted-foreground">
                            No role
                        </span>
                    )}
                </div>
            ),
        },
        {
            label: 'Created At',
            render: (row) => new Date(row.created_at).toLocaleDateString(),
        },
        ...(canUpdateStatus
            ? [
                  {
                      label: 'Status',
                      render: (row: UserItem) => (
                          <div className="flex items-center gap-2">
                              <Switch
                                  checked={row.is_active}
                                  onCheckedChange={() => {
                                      if (row.is_active) {
                                          // Mau deactivate → buka dialog
                                          setConfirmingUser(row);
                                      } else {
                                          // Mau activate → langsung toggle
                                          handleToggleStatus(row.id);
                                      }
                                  }}
                              />
                              <span className="text-xs text-muted-foreground">
                                  {row.is_active ? 'Active' : 'Inactive'}
                              </span>
                          </div>
                      ),
                  },
              ]
            : []),
        ...(canEdit || canDelete || canUpdateStatus
            ? [
                  {
                      label: 'Action',
                      render: (row: UserItem) => (
                          <div className="flex gap-2">
                              {canEdit && (
                                  <Link
                                      href={`/my-admin/dashboard/users/${row.id}/edit`}
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

                              <AlertDialog
                                  open={!!confirmingUser}
                                  onOpenChange={() => setConfirmingUser(null)}
                              >
                                  <AlertDialogContent>
                                      <AlertDialogHeader>
                                          <AlertDialogTitle>
                                              Deactivate User?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                              {confirmingUser && (
                                                  <>
                                                      You are about to
                                                      deactivate{' '}
                                                      <strong>
                                                          {confirmingUser.name}
                                                      </strong>
                                                      . This user will no longer
                                                      be able to log in.
                                                      <br />
                                                      <br />
                                                      This action can be
                                                      reversed later.
                                                  </>
                                              )}
                                          </AlertDialogDescription>
                                      </AlertDialogHeader>

                                      <AlertDialogFooter>
                                          <AlertDialogCancel>
                                              Cancel
                                          </AlertDialogCancel>

                                          <AlertDialogAction
                                              onClick={() => {
                                                  if (confirmingUser) {
                                                      handleToggleStatus(
                                                          confirmingUser.id,
                                                      );
                                                      setConfirmingUser(null);
                                                  }
                                              }}
                                              className="bg-destructive text-white hover:bg-destructive/90"
                                          >
                                              Yes, Deactivate
                                          </AlertDialogAction>
                                      </AlertDialogFooter>
                                  </AlertDialogContent>
                              </AlertDialog>
                          </div>
                      ),
                  },
              ]
            : []),
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />

            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Users</h1>

                    {canCreate && (
                        <Link href="/my-admin/dashboard/users/create">
                            <Button>Add New User</Button>
                        </Link>
                    )}
                </div>

                {/* FILTER */}
                <div className="flex flex-wrap gap-3">
                    <input
                        className="rounded border px-3 py-2"
                        placeholder="Search name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <select
                        className="rounded border px-3 py-2"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <option value="">All Roles</option>
                        {roles.map((r) => (
                            <option key={r.id} value={r.name}>
                                {r.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="rounded border px-3 py-2"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <Button onClick={applyFilter}>Apply</Button>
                </div>

                {/* TABLE */}
                <DataTable<UserItem> data={users.data} columns={columns} />

                {/* PAGINATION */}
                <div className="flex flex-wrap gap-2">
                    {users.links.map((link, i) => (
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
