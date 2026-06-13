import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/management-layout';
import { BreadcrumbItem } from '@/types';

interface Props {
    stats: {
        users: number;
        roles: number;
        permissions: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Settings',
        href: '/my-admin/dashboard/config/main',
    },
    {
        title: 'Management',
        href: '/my-admin/dashboard/config/management',
    },
];

export default function Management({ stats }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Management" />

            <div className="container mx-auto px-6 py-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* USERS */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Total Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {stats.users}
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Registered users in system
                            </p>
                        </CardContent>
                    </Card>

                    {/* ROLES */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Total Roles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {stats.roles}
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Available system roles
                            </p>
                        </CardContent>
                    </Card>

                    {/* PERMISSIONS */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Total Permissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {stats.permissions}
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Configured permissions
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
