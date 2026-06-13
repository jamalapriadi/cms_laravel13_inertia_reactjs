import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/wilayah-layout';

interface Province {
    id: number;
    name: string;
}

interface Kabupaten {
    id: number;
    name: string;
    province_id: number;
}

interface Kecamatan {
    id: number;
    name: string;
    kabupaten_id: number;
    kabupaten?: {
        province?: Province;
    };
}

interface Props {
    kecamatan: Kecamatan;
    provinces: Province[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Kecamatans', href: '/my-admin/dashboard/kecamatans' },
    { title: 'Edit', href: '#' },
];

export default function Edit({ kecamatan, provinces }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        province_id: kecamatan.kabupaten?.province?.id
            ? String(kecamatan.kabupaten.province.id)
            : '',
        kabupaten_id: String(kecamatan.kabupaten_id),
        name: kecamatan.name,
    });

    const [kabupatens, setKabupatens] = useState<Kabupaten[]>([]);
    const [loadingKabupaten, setLoadingKabupaten] = useState(false);

    // Load kabupaten saat pertama render & saat province berubah
    useEffect(() => {
        if (!data.province_id) {
            setKabupatens([]);
            return;
        }

        const fetchKabupaten = async () => {
            try {
                setLoadingKabupaten(true);
                const res = await axios.get(
                    `/api/kabupaten/${data.province_id}`,
                );
                setKabupatens(res.data);
            } catch (error) {
                console.error('Gagal mengambil kabupaten:', error);
            } finally {
                setLoadingKabupaten(false);
            }
        };

        fetchKabupaten();
    }, [data.province_id]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/my-admin/dashboard/kecamatans/${kecamatan.id}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Kecamatan" />

            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">Edit Kecamatan</h1>
                </div>

                {/* FORM CARD */}
                <div className="max-w-xl rounded-xl border bg-background p-6 shadow-sm">
                    <form onSubmit={submit} className="space-y-5">
                        {/* KODE (READONLY) */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Kode</label>
                            <input
                                disabled
                                value={kecamatan.id}
                                className="w-full rounded-md border bg-muted px-3 py-2"
                            />
                        </div>

                        {/* PROVINCE */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium">
                                Provinsi
                            </label>
                            <select
                                className="w-full rounded-md border px-3 py-2"
                                value={data.province_id}
                                onChange={(e) => {
                                    setData('province_id', e.target.value);
                                    setData('kabupaten_id', '');
                                }}
                            >
                                <option value="">-- Pilih Provinsi --</option>
                                {provinces.map((prov) => (
                                    <option key={prov.id} value={prov.id}>
                                        {prov.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* KABUPATEN */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium">
                                Kabupaten
                            </label>
                            <select
                                className="w-full rounded-md border px-3 py-2"
                                value={data.kabupaten_id}
                                onChange={(e) =>
                                    setData('kabupaten_id', e.target.value)
                                }
                                disabled={
                                    !data.province_id ||
                                    loadingKabupaten ||
                                    !kabupatens.length
                                }
                            >
                                <option value="">
                                    {loadingKabupaten
                                        ? 'Loading...'
                                        : '-- Pilih Kabupaten --'}
                                </option>

                                {kabupatens.map((kab) => (
                                    <option key={kab.id} value={kab.id}>
                                        {kab.name}
                                    </option>
                                ))}
                            </select>

                            {errors.kabupaten_id && (
                                <p className="text-sm text-red-500">
                                    {errors.kabupaten_id}
                                </p>
                            )}
                        </div>

                        {/* NAMA */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium">
                                Nama Kecamatan
                            </label>
                            <input
                                type="text"
                                className="w-full rounded-md border px-3 py-2"
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

                        {/* BUTTON */}
                        <div className="flex justify-between gap-3">
                            <Link href="/my-admin/dashboard/kecamatans">
                                <Button variant="outline" disabled={processing}>
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Updating...' : 'Update'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
