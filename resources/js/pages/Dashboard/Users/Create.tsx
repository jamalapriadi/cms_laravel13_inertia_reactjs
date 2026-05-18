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

interface Role {
    id: number;
    name: string;
}

interface Props {
    roles: Role[];
}

export default function Create({ roles }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        roles: [] as string[],
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Users', href: '/dashboard/users' },
        { title: 'Create', href: '/dashboard/users/create' },
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

        post('/dashboard/users', {
            onStart: () => toast.loading('Creating user...'),
            onSuccess: () => {
                toast.dismiss();
                toast.success('User created successfully!');
            },
            onError: () => {
                toast.dismiss();
                toast.error('Failed to create user.');
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create User" />

            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Create User</CardTitle>
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

                            {/* Password */}
                            <div className="space-y-2">
                                <Label>Password</Label>
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

                            {/* Roles */}
                            <div className="space-y-4">
                                <Label>Assign Roles</Label>

                                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                    {roles.map((role) => (
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
                                    {processing ? 'Creating...' : 'Create User'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
