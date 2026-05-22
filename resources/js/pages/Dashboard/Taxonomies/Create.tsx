import { Head, useForm } from '@inertiajs/react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

interface Props {
    taxonomy: string;
}

export default function Create({ taxonomy }: Props) {
    /**
     * ✅ FORM (CONSISTENT)
     */
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
    });

    /**
     * ✅ TITLE RESOLVER
     */
    const getTitle = () => {
        switch (taxonomy) {
            case 'categories':
                return 'Tambah Category';
            case 'tags':
                return 'Tambah Tag';
            default:
                return 'Tambah Taxonomy';
        }
    };

    const title = getTitle();

    /**
     * ✅ SUBMIT HANDLER
     */
    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post(`/dashboard/taxonomies/${taxonomy}`, {
            onStart: () => toast.loading('Saving...', { id: 'save' }),
            onSuccess: () =>
                toast.success('Data berhasil disimpan', { id: 'save' }),
            onError: () => toast.error('Terjadi kesalahan', { id: 'save' }),
        });
    };

    return (
        <>
            <Head title={title} />

            <div className="container mx-auto space-y-6 px-6 py-10">
                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">{title}</h1>
                    <p className="text-muted-foreground">Kelola data {taxonomy}</p>
                </div>

                {/* FORM */}
                <Card className="max-w-xl">
                    <CardHeader>
                        <CardTitle>{title}</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
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
                                    {processing ? 'Saving...' : 'Save'}
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
 * ✅ CONSISTENT LAYOUT (SEPERTI INDEX)
 */
Create.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            {
                title: 'Taxonomies',
                href: '/dashboard/taxonomies/tags',
            },
            {
                title: 'Create',
                href: '#',
            },
        ]}
    >
        {page}
    </AppLayout>
);
