import { Head, useForm, router } from '@inertiajs/react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
    });

    /**
     * AUTO GENERATE SLUG
     */
    const generateSlug = (value: string) => {
        return value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    /**
     * SUBMIT
     */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/my-admin/dashboard/menus', {
            preserveScroll: true,
            onStart: () => toast.loading('Saving...', { id: 'save' }),
            onSuccess: () => {
                toast.success('Menu berhasil dibuat!', { id: 'save' });
                router.visit('/my-admin/dashboard/menus');
            },
            onError: () => {
                toast.error('Gagal membuat menu', { id: 'save' });
            },
        });
    };

    return (
        <>
            <Head title="Create Menu" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">Create Menu</h1>
                    <p className="text-muted-foreground">Add a new navigation menu</p>
                </div>

                <hr />

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6 rounded-xl bg-card p-6 shadow">
                        {/* NAME */}
                        <div className="flex flex-col gap-1">
                            <Label>Menu Name</Label>
                            <Input
                                value={data.name}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setData('name', value);
                                    setData('slug', generateSlug(value));
                                }}
                                placeholder="Menu Name"
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* SLUG */}
                        <div className="flex flex-col gap-1">
                            <Label>Slug</Label>
                            <Input
                                value={data.slug}
                                onChange={(e) =>
                                    setData('slug', e.target.value)
                                }
                                placeholder="menu-slug"
                            />
                            {errors.slug && (
                                <p className="text-sm text-destructive">
                                    {errors.slug}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/my-admin/dashboard/menus')}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Create Menu'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

/**
 * ✅ CONSISTENT LAYOUT
 */
Create.layout = {
    breadcrumbs: [
        { title: 'Menus', href: '/my-admin/dashboard/menus' },
        { title: 'Create', href: '/my-admin/dashboard/menus/create' },
    ],
};
