import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/management-layout';
import type { BreadcrumbItem } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { toast } from 'sonner';

interface Permission {
    id: number;
    name: string;
    guard_name: string;
}

interface Props {
    permission: Permission;
}

export default function Edit({ permission }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: permission.name,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Permissions',
            href: '/my-admin/dashboard/permissions',
        },
        {
            title: 'Edit',
            href: `/my-admin/dashboard/permissions/${permission.id}/edit`,
        },
    ];

    function submit(e: React.FormEvent) {
        e.preventDefault();

        put(`/my-admin/dashboard/permissions/${permission.id}`, {
            onStart: () => toast.loading('Updating permission...'),
            onSuccess: () => {
                toast.dismiss();
                toast.success('Permission berhasil diupdate');
            },
            onError: () => {
                toast.dismiss();
                toast.error('Terjadi kesalahan saat update');
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Permission" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <Card className="max-w-xl">
                    <CardHeader>
                        <CardTitle>Edit Permission</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            {/* ID (Readonly) */}
                            <div className="space-y-2">
                                <Label>ID</Label>
                                <Input
                                    value={permission.id}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>

                            {/* Permission Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Permission Name</Label>
                                <Input
                                    id="name"
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

                            {/* Guard (Readonly) */}
                            <div className="space-y-2">
                                <Label>Guard</Label>
                                <Input
                                    value={permission.guard_name}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-between gap-2">
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
