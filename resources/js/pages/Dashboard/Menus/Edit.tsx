import { Head, router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Menu {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    menu: Menu;
}

export default function Edit({ menu }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: menu.name,
        slug: menu.slug,
    });

    const generateSlug = (value: string) => {
        return value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        put(`/dashboard/menus/${menu.id}`, {
            preserveScroll: true,
            onStart: () => toast.loading('Saving...', { id: 'save-menu' }),
            onSuccess: () => toast.success('Menu berhasil diperbarui', { id: 'save-menu' }),
            onError: () => toast.error('Gagal memperbarui menu', { id: 'save-menu' }),
        });
    };

    return (
        <>
            <Head title="Edit Menu" />

            <div className="container mx-auto space-y-10 px-6 py-10">
                <div>
                    <h1 className="text-2xl font-bold">Edit Menu</h1>
                    <p className="text-muted-foreground">Update menu name and slug</p>
                </div>

                <hr />

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6 rounded-xl bg-card p-6 shadow">
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
                                <p className="text-sm text-destructive">{errors.name}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label>Slug</Label>
                            <Input
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value)}
                                placeholder="menu-slug"
                            />
                            {errors.slug && (
                                <p className="text-sm text-destructive">{errors.slug}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/dashboard/menus')}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Update Menu'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

Edit.layout = {
    breadcrumbs: [
        { title: 'Menus', href: '/dashboard/menus' },
        { title: 'Edit', href: '#' },
    ],
};
