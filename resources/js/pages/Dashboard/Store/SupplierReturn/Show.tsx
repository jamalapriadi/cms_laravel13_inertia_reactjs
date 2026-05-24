import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit } from 'lucide-react';

import { Button } from '@/components/ui/button';
// import AppLayout from '@/layouts/master-data-layout';

interface SupplierReturn {
    id: string;
    supplier?: { name: string } | null;
    return_number: string;
    return_date: string;
    status: 'pending' | 'completed' | 'cancelled';
    note?: string | null;
    items: Array<{
        id: string;
        notes?: string | null;
        stock_unit?: {
            imei_serial_number: string;
            network_compatibility?: string | null;
            status: string;
            variant?: {
                name: string;
                sku: string;
                product?: { name: string } | null;
            } | null;
        } | null;
    }>;
}

interface Props {
    supplierReturn: SupplierReturn;
}

const statusClass = (status: SupplierReturn['status']) =>
    ({
        pending:
            'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
        completed:
            'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
        cancelled:
            'border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300',
    })[status];

export default function Show({ supplierReturn }: Props) {
    return (
        <>
            <Head title="Detail Retur Barang" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/ecommerce/supplier-returns">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">
                                Detail Retur Barang
                            </h1>
                            <p className="font-mono text-sm text-muted-foreground">
                                {supplierReturn.return_number}
                            </p>
                        </div>
                    </div>

                    {supplierReturn.status === 'pending' && (
                        <Link
                            href={`/dashboard/ecommerce/supplier-returns/${supplierReturn.id}/edit`}
                        >
                            <Button className="gap-2">
                                <Edit className="h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                    )}
                </div>

                <div className="grid gap-4 rounded-xl border bg-card p-6 shadow-sm md:grid-cols-4">
                    <Info
                        label="Supplier"
                        value={supplierReturn.supplier?.name}
                    />
                    <Info
                        label="Tanggal"
                        value={new Date(
                            supplierReturn.return_date,
                        ).toLocaleDateString('id-ID')}
                    />
                    <div>
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Status
                        </span>
                        <p className="mt-1">
                            <span
                                className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold uppercase ${statusClass(supplierReturn.status)}`}
                            >
                                {supplierReturn.status}
                            </span>
                        </p>
                    </div>
                    <Info
                        label="Jumlah Item"
                        value={String(supplierReturn.items.length)}
                    />
                    <div className="md:col-span-4">
                        <Info
                            label="Catatan"
                            value={supplierReturn.note || '-'}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Barang Diretur</h2>
                    {supplierReturn.items.map((item) => (
                        <div
                            key={item.id}
                            className="grid gap-4 rounded-xl border bg-card p-5 shadow-sm md:grid-cols-4"
                        >
                            <Info
                                label="IMEI / Serial"
                                value={item.stock_unit?.imei_serial_number}
                            />
                            <Info
                                label="Produk"
                                value={item.stock_unit?.variant?.product?.name}
                            />
                            <Info
                                label="Variant"
                                value={`${item.stock_unit?.variant?.name ?? '-'} (${item.stock_unit?.variant?.sku ?? '-'})`}
                            />
                            <Info
                                label="Status Stok"
                                value={item.stock_unit?.status}
                            />
                            <div className="md:col-span-4">
                                <Info
                                    label="Keterangan Kerusakan"
                                    value={item.notes || '-'}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

function Info({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {label}
            </span>
            <p className="mt-1 text-sm font-medium text-foreground">
                {value || '-'}
            </p>
        </div>
    );
}
