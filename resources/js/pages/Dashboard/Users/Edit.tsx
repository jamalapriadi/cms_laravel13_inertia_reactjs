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
import { usePermission } from '@/lib/permissions';

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    roles: Role[];
}

interface Props {
    user: User;
    roles: Role[];
}

export default function Edit({ user, roles }: Props) {
    const { hasPermission, hasRole } = usePermission();
    const canAssignRole = hasPermission('users.assign-role');
    const assignableRoles = hasRole('super-admin')
        ? roles
        : roles.filter((role) => role.name !== 'super-admin');

    const initialRoles = useMemo(() => user.roles.map((r) => r.name), [user]);

    const { data, setData, put, processing, errors, transform } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        roles: initialRoles as string[],
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Users', href: '/my-admin/dashboard/users' },
        { title: 'Edit', href: `/my-admin/dashboard/users/${user.id}/edit` },
    ];

    function toggleRole(roleName: string) {
        if (data.roles.includes(roleName)) {
            setData(
                'roles',
                data.roles.filter((r) => r !== roleName),
            );
        } else {
            setData('roles', [...data.roles, roleName]);
        }
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        transform((payload) =>
            canAssignRole
                ? payload
                : {
                      name: payload.name,
                      email: payload.email,
                      password: payload.password,
                  },
        );

        put(`/my-admin/dashboard/users/${user.id}`, {
            onStart: () => toast.loading('Updating user...'),
            onSuccess: () => {
                toast.dismiss();
                toast.success('User updated successfully!');
            },
            onError: () => {
                toast.dismiss();
                toast.error('Failed to update user.');
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit User" />

            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit User</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={submit} className="space-y-8">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label>Name</Label>
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

                            {/* Email */}
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password (Optional) */}
                            <div className="space-y-2">
                                <Label>
                                    Password{' '}
                                    <span className="text-xs text-muted-foreground">
                                        (Leave blank if not changing)
                                    </span>
                                </Label>
                                <Input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                />
                                {errors.password && (
                                    <p className="text-sm text-destructive">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {canAssignRole && (
                                <div className="space-y-4">
                                    <Label>Assign Roles</Label>

                                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                        {assignableRoles.map((role) => (
                                            <div
                                                key={role.id}
                                                className="flex items-center space-x-2"
                                            >
                                                <Checkbox
                                                    checked={data.roles.includes(
                                                        role.name,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleRole(role.name)
                                                    }
                                                />
                                                <span className="text-sm">
                                                    {role.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {errors.roles && (
                                        <p className="text-sm text-destructive">
                                            {errors.roles}
                                        </p>
                                    )}
                                </div>
                            )}

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
                                    {processing ? 'Updating...' : 'Update User'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
