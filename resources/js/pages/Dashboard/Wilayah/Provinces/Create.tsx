import { Head, Link, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/wilayah-layout';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Provinces', href: '/my-admin/dashboard/provinces' },
    { title: 'Create', href: '/my-admin/dashboard/provinces/create' },
];

export default function Create() {
    const { data, setData, post, processing, errors, reset } = useForm({
        id: '',
        name: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/my-admin/dashboard/provinces', {
            onStart: () => toast.loading('Saving...'),
            onSuccess: () => toast.dismiss(),
            onError: () => toast.dismiss(),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Province" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                <div className="max-w-xl rounded-xl border border-sidebar-border/70 p-6 dark:border-sidebar-border">
                    <h1 className="mb-6 text-xl font-semibold">
                        Create Province
                    </h1>

                    <form onSubmit={submit} className="space-y-5">
                        {/* Province Code */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Province Code (2 Characters)
                            </label>
                            <Input
                                maxLength={2}
                                value={data.id}
                                onChange={(e) =>
                                    setData('id', e.target.value.toUpperCase())
                                }
                                placeholder="ex: JK"
                            />
                            {errors.id && (
                                <p className="text-sm text-red-500">
                                    {errors.id}
                                </p>
                            )}
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
                                placeholder="Province Name"
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
