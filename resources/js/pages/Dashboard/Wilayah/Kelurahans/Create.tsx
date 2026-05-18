import { Head, useForm } from '@inertiajs/react';
import axios from 'axios';
import { useState, useEffect } from 'react';

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
    name: string;
}

interface Kecamatan {
    id: string;
    name: string;
}

interface Props {
    provinces: Province[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kelurahans',
        href: '/dashboard/kelurahans',
    },
    {
        title: 'Create',
        href: '/dashboard/kelurahans/create',
    },
];

export default function Create({ provinces }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        id: '',
        province_id: '',
        kabupaten_id: '',
        kecamatan_id: '',
        name: '',
    });

    const [kabupatens, setKabupatens] = useState<Kabupaten[]>([]);
    const [kecamatans, setKecamatans] = useState<Kecamatan[]>([]);

    // Load Kabupaten
    useEffect(() => {
        if (!data.province_id) {
            setKabupatens([]);
            setKecamatans([]);

            return;
        }

        axios.get(`/api/kabupaten/${data.province_id}`).then((res) => {
            setKabupatens(res.data);
            setData('kabupaten_id', '');
            setData('kecamatan_id', '');
            setKecamatans([]);
        });
    }, [data.province_id]);

    // Load Kecamatan
    useEffect(() => {
        if (!data.kabupaten_id) {
            setKecamatans([]);

            return;
        }

        axios.get(`/api/kecamatan/${data.kabupaten_id}`).then((res) => {
            setKecamatans(res.data);
            setData('kecamatan_id', '');
        });
    }, [data.kabupaten_id]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/dashboard/kelurahans');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Kelurahan" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <Card className="max-w-xl">
                    <CardHeader>
                        <CardTitle>Tambah Kelurahan</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            {/* ID */}
                            <div className="space-y-2">
                                <Label htmlFor="id">Kode (13 digit)</Label>
                                <Input
                                    id="id"
                                    value={data.id}
                                    onChange={(e) =>
                                        setData('id', e.target.value)
                                    }
                                    placeholder="Contoh: 3201010001001"
                                />
                                {errors.id && (
                                    <p className="text-sm text-destructive">
                                        {errors.id}
                                    </p>
                                )}
                            </div>

                            {/* Provinsi */}
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

                            {/* Kabupaten */}
                            <div className="space-y-2">
                                <Label>Kabupaten</Label>
                                <Select
                                    value={data.kabupaten_id}
                                    onValueChange={(value) =>
                                        setData('kabupaten_id', value)
                                    }
                                    disabled={!data.province_id}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Kabupaten" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {kabupatens.map((kab) => (
                                            <SelectItem
                                                key={kab.id}
                                                value={kab.id}
                                            >
                                                {kab.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {errors.kabupaten_id && (
                                    <p className="text-sm text-destructive">
                                        {errors.kabupaten_id}
                                    </p>
                                )}
                            </div>

                            {/* Kecamatan */}
                            <div className="space-y-2">
                                <Label>Kecamatan</Label>
                                <Select
                                    value={data.kecamatan_id}
                                    onValueChange={(value) =>
                                        setData('kecamatan_id', value)
                                    }
                                    disabled={!data.kabupaten_id}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Kecamatan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {kecamatans.map((kec) => (
                                            <SelectItem
                                                key={kec.id}
                                                value={kec.id}
                                            >
                                                {kec.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {errors.kecamatan_id && (
                                    <p className="text-sm text-destructive">
                                        {errors.kecamatan_id}
                                    </p>
                                )}
                            </div>

                            {/* Nama */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Kelurahan</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="Contoh: Kelurahan Sukamaju"
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
