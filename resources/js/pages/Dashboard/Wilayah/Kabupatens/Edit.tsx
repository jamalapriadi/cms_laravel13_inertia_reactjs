import { Head, useForm } from '@inertiajs/react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import type { BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/wilayah-layout';

interface Province {
    id: string;
    name: string;
}

interface Kabupaten {
    id: string;
    province_id: string;
    name: string;
}

interface Props {
    kabupaten: Kabupaten;
    provinces: Province[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kabupatens',
        href: '/my-admin/dashboard/kabupatens',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

export default function Edit({ kabupaten, provinces }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        province_id: kabupaten.province_id,
        name: kabupaten.name,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/my-admin/dashboard/kabupatens/${kabupaten.id}`, {
            onStart: () => toast.loading('Saving...'),
            onSuccess: () => toast.dismiss(),
            onError: () => toast.dismiss(),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Kabupaten" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <Card className="max-w-xl">
                    <CardHeader>
                        <CardTitle>Edit Kabupaten</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            {/* ID (Readonly) */}
                            <div className="space-y-2">
                                <Label>Kode</Label>
                                <Input
                                    value={kabupaten.id}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>

                            {/* Province */}
                            <div className="space-y-2">
                                <Label>Provinsi</Label>
                                <Select
                                    value={data.province_id}
                                    onValueChange={(value) =>
                                        setData('province_id', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Provinsi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {provinces.map((prov) => (
                                            <SelectItem
                                                key={prov.id}
                                                value={prov.id}
                                            >
                                                {prov.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {errors.province_id && (
                                    <p className="text-sm text-destructive">
                                        {errors.province_id}
                                    </p>
                                )}
                            </div>

                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Kabupaten</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="Contoh: Kabupaten Bandung"
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
