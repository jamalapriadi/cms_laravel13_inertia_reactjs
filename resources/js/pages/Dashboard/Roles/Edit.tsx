import { Head, useForm } from '@inertiajs/react';
import { useMemo } from 'react';
import AppLayout from '@/layouts/management-layout';
import type { BreadcrumbItem } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

import { toast } from 'sonner';

interface Permission {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
    guard_name: string;
    permissions: Permission[];
}

interface Props {
    role: Role;
    permissions: Permission[];
}

export default function Edit({ role, permissions }: Props) {
    const initialPermissions = useMemo(
        () => role.permissions.map((p) => p.name),
        [role],
    );

    const { data, setData, put, processing, errors } = useForm({
        name: role.name,
        permissions: initialPermissions as string[],
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Roles', href: '/dashboard/roles' },
        { title: 'Edit', href: `/dashboard/roles/${role.id}/edit` },
    ];

    function togglePermission(permissionName: string) {
        if (data.permissions.includes(permissionName)) {
            setData(
                'permissions',
                data.permissions.filter((p) => p !== permissionName),
            );
        } else {
            setData('permissions', [...data.permissions, permissionName]);
        }
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        put(`/dashboard/roles/${role.id}`, {
            onStart: () => toast.loading('Updating role...'),
            onSuccess: () => {
                toast.dismiss();
                toast.success('Role & permissions updated');
            },
            onError: () => {
                toast.dismiss();
                toast.error('Terjadi kesalahan');
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Role" />

            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Role</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={submit} className="space-y-8">
                            {/* Role Name */}
                            <div className="space-y-2">
                                <Label>Role Name</Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Permissions */}
                            <div className="space-y-4">
                                <Label>Permissions</Label>

                                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                    {permissions.map((permission) => (
                                        <div
                                            key={permission.id}
                                            className="flex items-center space-x-2"
                                        >
                                            <Checkbox
                                                checked={data.permissions.includes(
                                                    permission.name,
                                                )}
                                                onCheckedChange={() =>
                                                    togglePermission(
                                                        permission.name,
                                                    )
                                                }
                                            />
                                            <span className="text-sm">
                                                {permission.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-between">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => window.history.back()}
                                >
                                    Cancel
                                </Button>

                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Updating...' : 'Update'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
