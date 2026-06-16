import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProductStockUnit {
    id: string;
    imei_serial_number: string;
    barcode?: string | null;
    status: string;
    note?: string | null;
    created_at: string;
    product?: {
        id: string;
        name: string;
        sku?: string | null;
    } | null;
    variant?: {
        id: string;
        name: string;
        sku: string;
        product?: {
            id: string;
            name: string;
        } | null;
    } | null;
}

interface Props {
    stockUnit: ProductStockUnit;
}



export default function Show({ stockUnit }: Props) {
    const hasBarcode = !!stockUnit.barcode;

    return (
        <>
            <Head title="Detail Stok Unit" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/my-admin/dashboard/ecommerce/product-stock-units">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">
                                Detail Stok Unit
                            </h1>
                            <p className="font-mono text-sm text-muted-foreground">
                                {stockUnit.imei_serial_number}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {!hasBarcode && (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    router.post(
                                        `/my-admin/dashboard/ecommerce/product-stock-units/${stockUnit.id}/generate-barcode`,
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                Generate Barcode
                            </Button>
                        )}

                        {hasBarcode && (
                            <Link
                                href={`/my-admin/dashboard/ecommerce/product-stock-units/barcodes/print?ids=${stockUnit.id}`}
                            >
                                <Button variant="outline">Print Barcode</Button>
                            </Link>
                        )}

                        <Link
                            href={`/my-admin/dashboard/ecommerce/product-stock-units/${stockUnit.id}/edit`}
                        >
                            <Button className="gap-2">
                                <Edit className="h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-4 rounded-xl border bg-card p-6 shadow-sm md:grid-cols-2">
                    <Info
                        label="Product"
                        value={
                            stockUnit.product?.name ||
                            stockUnit.variant?.product?.name
                        }
                    />
                    <Info
                        label="Product Variant"
                        value={stockUnit.variant?.name || '-'}
                    />
                    <Info
                        label="SKU"
                        value={
                            stockUnit.variant?.sku ||
                            stockUnit.product?.sku ||
                            '-'
                        }
                    />
                    <Info
                        label="Serial Number"
                        value={stockUnit.imei_serial_number}
                    />
                    <Info
                        label="Barcode"
                        value={stockUnit.barcode || '-'}
                        mono
                    />
                    <div>
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Status
                        </span>
                        <p className="mt-1">
                            <Badge variant="secondary" className="uppercase">
                                {stockUnit.status}
                            </Badge>
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <Info label="Note" value={stockUnit.note || '-'} />
                    </div>
                </div>
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
    value?: string | null;
    mono?: boolean;
}) {
    return (
        <div>
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {label}
            </span>
            <p
                className={`mt-1 text-sm font-medium text-foreground ${mono ? 'font-mono' : ''}`}
            >
                {value || '-'}
            </p>
        </div>
    );
}
