import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/wilayah-layout';

interface Province {
    id: string;
    name: string;
}

interface Props {
    province: Province;
}

export default function Edit({ province }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Provinces', href: '/my-admin/dashboard/provinces' },
        { title: 'Edit', href: `/my-admin/dashboard/provinces/${province.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        id: '',
        name: '',
    });

    // 🔥 Important fix
    useEffect(() => {
        if (province) {
            setData({
                id: province.id ?? '',
                name: province.name ?? '',
            });
        }
    }, [province]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/my-admin/dashboard/provinces/${province.id}`, {
            onStart: () => toast.loading('Saving...'),
            onSuccess: () => toast.dismiss(),
            onError: () => toast.dismiss(),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Province" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                <div className="max-w-xl rounded-xl border border-sidebar-border/70 p-6 dark:border-sidebar-border">
                    <h1 className="mb-6 text-xl font-semibold">
                        Edit Province
                    </h1>

                    <form onSubmit={submit} className="space-y-5">
                        {/* Province Code */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Province Code
                            </label>
                            <Input
                                value={data.id}
                                disabled
                                readOnly
                                className="cursor-not-allowed bg-muted"
                            />
                        </div>

                        {/* Province Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Province Name
                            </label>
                            <Input
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-between gap-3">
                            <Link href="/my-admin/dashboard/provinces">
                                <Button variant="outline" disabled={processing}>
                                    Cancel
                                </Button>
                            </Link>
                            <Button disabled={processing}>
                                {processing ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
