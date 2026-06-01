import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit } from 'lucide-react';

import { Button } from '@/components/ui/button';
// import AppLayout from '@/layouts/master-data-layout';

interface IncomingGoods {
    id: string;
    supplier?: { name: string } | null;
    creator?: { name: string } | null;
    invoice_number: string;
    transaction_date: string;
    total_amount: number | string;
    status: 'pending' | 'completed' | 'cancelled';
    note?: string | null;
    items: Array<{
        id: string;
        qty: number;
        cost_price: number | string;
        subtotal: number | string;
        product?: { name: string } | null;
        variant?: { name: string; sku: string } | null;
        stock_units: Array<{
            id: string;
            imei_serial_number: string;
            network_compatibility?: string | null;
            status: string;
        }>;
    }>;
}

interface Props {
    incomingGoods: IncomingGoods;
}

const money = (value: number | string) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(Number(value));

const statusClass = (status: IncomingGoods['status']) =>
    ({
        pending:
            'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
        completed:
            'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
        cancelled:
            'border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300',
    })[status];

export default function Show({ incomingGoods }: Props) {
    return (
        <>
            <Head title="Detail Barang Masuk" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/ecommerce/incoming-goods">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">
                                Detail Barang Masuk
                            </h1>
                            <p className="font-mono text-sm text-muted-foreground">
                                {incomingGoods.invoice_number}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={`/dashboard/ecommerce/incoming-goods/${incomingGoods.id}/barcodes/print`}
                        >
                            <Button variant="outline">
                                Cetak Barcode Barang Masuk
                            </Button>
                        </Link>
                        {incomingGoods.status === 'pending' && (
                            <Link
                                href={`/dashboard/ecommerce/incoming-goods/${incomingGoods.id}/edit`}
                            >
                                <Button className="gap-2">
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 rounded-xl border bg-card p-6 shadow-sm md:grid-cols-4">
                    <Info
                        label="Supplier"
                        value={incomingGoods.supplier?.name}
                    />
                    <Info
                        label="Tanggal"
                        value={new Date(
                            incomingGoods.transaction_date,
                        ).toLocaleDateString('id-ID')}
                    />
                    <Info
                        label="Total"
                        value={money(incomingGoods.total_amount)}
                    />
                    <div>
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Status
                        </span>
                        <p className="mt-1">
                            <span
                                className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold uppercase ${statusClass(incomingGoods.status)}`}
                            >
                                {incomingGoods.status}
                            </span>
                        </p>
                    </div>
                    <div className="md:col-span-4">
                        <Info
                            label="Catatan"
                            value={incomingGoods.note || '-'}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Item Barang</h2>
                    {incomingGoods.items.map((item) => (
                        <div
                            key={item.id}
                            className="space-y-4 rounded-xl border bg-card p-5 shadow-sm"
                        >
                            <div className="grid gap-4 md:grid-cols-4">
                                <Info
                                    label="Produk"
                                    value={item.product?.name}
                                />
                                <Info
                                    label="Variant"
                                    value={`${item.variant?.name ?? '-'} (${item.variant?.sku ?? '-'})`}
                                />
                                <Info label="Qty" value={String(item.qty)} />
                                <Info
                                    label="Subtotal"
                                    value={money(item.subtotal)}
                                />
                            </div>
                            <div className="grid gap-2 md:grid-cols-2">
                                {item.stock_units.map((unit) => (
                                    <div
                                        key={unit.id}
                                        className="rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                                    >
                                        <span className="font-mono font-semibold">
                                            {unit.imei_serial_number}
                                        </span>
                                        <span className="ml-2 text-muted-foreground">
                                            {unit.network_compatibility ?? '-'}{' '}
                                            / {unit.status}
                                        </span>
                                    </div>
                                ))}
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
