import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface StockUnitResult {
    id: string;
    barcode?: string | null;
    product_name: string;
    sku: string;
    imei_serial_number: string;
    grade?: string | null;
    battery_health?: number | null;
    status: string;
    location?: string | null;
    last_activity?: string | null;
    note?: string | null;
}

interface Props {
    search?: string;
    stockUnit?: StockUnitResult | null;
    notFound?: boolean;
}

export default function BarcodeScannerIndex({ search, stockUnit, notFound }: Props) {
    const { data, setData, post, processing } = useForm({
        search: search || '',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        post('/dashboard/ecommerce/barcode-scanner/search', {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Barcode Scanner" />

            <div className="container mx-auto space-y-6 px-6 py-8">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/ecommerce/product-stock-units">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Barcode Scanner</h1>
                        <p className="text-sm text-muted-foreground">
                            Scan barcode/IMEI menggunakan scanner USB atau input manual.
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Input
                            autoFocus
                            value={data.search}
                            onChange={(event) => setData('search', event.target.value)}
                            placeholder="Scan barcode / IMEI / serial"
                            className="h-11 font-mono"
                        />
                        <Button type="submit" className="h-11 gap-2" disabled={processing}>
                            <Search className="h-4 w-4" />
                            Cari
                        </Button>
                    </div>
                </form>

                {notFound && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        Data stock unit tidak ditemukan untuk kode tersebut.
                    </div>
                )}

                {stockUnit && (
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h2 className="text-lg font-semibold">Hasil Scan</h2>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <Info label="Barcode" value={stockUnit.barcode || '-'} mono />
                            <Info label="Product" value={stockUnit.product_name} />
                            <Info label="SKU" value={stockUnit.sku} />
                            <Info label="IMEI / Serial" value={stockUnit.imei_serial_number} mono />
                            <Info label="Grade" value={stockUnit.grade || '-'} />
                            <Info
                                label="Battery Health"
                                value={
                                    stockUnit.battery_health === null || stockUnit.battery_health === undefined
                                        ? '-'
                                        : `${stockUnit.battery_health}%`
                                }
                            />
                            <Info label="Status" value={stockUnit.status} />
                            <Info label="Location" value={stockUnit.location || '-'} />
                            <Info
                                label="Last Activity"
                                value={
                                    stockUnit.last_activity
                                        ? new Date(stockUnit.last_activity).toLocaleString('id-ID')
                                        : '-'
                                }
                            />
                            <Info label="Note" value={stockUnit.note || '-'} />
                        </div>

                        <div className="mt-5">
                            <Link href={`/dashboard/ecommerce/product-stock-units/${stockUnit.id}`}>
                                <Button variant="outline">View Detail Stock Unit</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

function Info({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div>
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
            <p className={`mt-1 text-sm font-medium text-foreground ${mono ? 'font-mono' : ''}`}>{value}</p>
        </div>
    );
}
