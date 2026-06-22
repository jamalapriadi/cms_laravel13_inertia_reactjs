import { Head, useForm } from '@inertiajs/react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

interface Term {
    name: string;
    slug: string;
}

interface Item {
    id: number;
    description: string;
    term: Term;
}

interface Props {
    taxonomy: string;
    item: Item;
}

export default function Edit({ taxonomy, item }: Props) {
    /**
     * ✅ FORM (CONSISTENT)
     */
    const { data, setData, put, processing, errors } = useForm({
        name: item.term.name ?? '',
        slug: item.term.slug ?? '',
        description: item.description ?? '',
    });

    /**
     * ✅ TITLE RESOLVER
     */
    const getTitle = () => {
        switch (taxonomy) {
            case 'categories':
                return 'Edit Category';
            case 'tags':
                return 'Edit Tag';
            default:
                return 'Edit Taxonomy';
        }
    };

    const title = getTitle();

    /**
     * ✅ SUBMIT
     */
    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        put(`/my-admin/dashboard/taxonomies/${taxonomy}/${item.id}`, {
            onStart: () => toast.loading('Updating...', { id: 'update' }),
            onSuccess: () =>
                toast.success('Data berhasil diupdate', { id: 'update' }),
            onError: () => toast.error('Terjadi kesalahan', { id: 'update' }),
        });
    };

    return (
        <>
            <Head title={title} />

            <div className="container mx-auto space-y-6 px-6 py-10">
                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">{title}</h1>
                    <p className="text-muted-foreground">
                        Edit data {taxonomy}
                    </p>
                </div>

                {/* FORM */}
                <Card className="max-w-xl">
                    <CardHeader>
                        <CardTitle>{title}</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            {/* ID (Readonly) */}
                            <div className="space-y-2">
                                <Label>ID</Label>
                                <Input
                                    value={item.id}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>

                            {/* NAME */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="Masukkan nama"
                                />

                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* SLUG */}
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    value={data.slug}
                                    onChange={(e) =>
                                        setData('slug', e.target.value)
                                    }
                                    placeholder="slug-term"
                                />
                                <p className="text-xs text-muted-foreground">
                                    You can edit this slug manually. Make sure it remains unique.
                                </p>
                                {errors.slug && (
                                    <p className="text-sm text-destructive">
                                        {errors.slug}
                                    </p>
                                )}
                            </div>

                            {/* DESCRIPTION */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                />

                                {errors.description && (
                                    <p className="text-sm text-destructive">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* ACTIONS */}
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
        </>
    );
}

/**
 * ✅ CONSISTENT LAYOUT
 */
Edit.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            {
                title: 'Taxonomies',
                href: '/my-admin/dashboard/taxonomies/tags',
            },
            {
                title: 'Edit',
                href: '#',
            },
        ]}
    >
        {page}
    </AppLayout>
);
