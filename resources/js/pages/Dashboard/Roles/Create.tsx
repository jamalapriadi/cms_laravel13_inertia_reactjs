import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/management-layout';
import type { BreadcrumbItem } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { toast } from 'sonner';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Roles',
            href: '/my-admin/dashboard/roles',
        },
        {
            title: 'Create',
            href: '/my-admin/dashboard/roles/create',
        },
    ];

    function submit(e: React.FormEvent) {
        e.preventDefault();

        post('/my-admin/dashboard/roles', {
            onStart: () => toast.loading('Saving role...'),
            onSuccess: () => {
                toast.dismiss();
                toast.success('Role berhasil dibuat');
            },
            onError: () => {
                toast.dismiss();
                toast.error('Terjadi kesalahan saat menyimpan');
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Role" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <Card className="max-w-xl">
                    <CardHeader>
                        <CardTitle>Create Role</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            {/* Role Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Role Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="Masukkan nama role"
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
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
                                    {processing ? 'Saving...' : 'Simpan'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
