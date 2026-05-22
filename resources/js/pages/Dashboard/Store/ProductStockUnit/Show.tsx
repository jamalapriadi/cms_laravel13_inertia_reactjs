import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit } from 'lucide-react';

import { Button } from '@/components/ui/button';
// import AppLayout from '@/layouts/master-data-layout';

interface ProductStockUnit {
    id: string;
    imei_serial_number: string;
    network_compatibility: string | null;
    status: string;
    note?: string | null;
    created_at: string;
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

const networkLabel = (network?: string | null) =>
    network
        ? ({
              sim_free: 'All Operator',
              docomo: 'Docomo',
              au: 'AU',
              softbank: 'SoftBank',
              rakuten: 'Rakuten',
              mineo: 'Mineo',
          }[network] ?? network)
        : '-';

export default function Show({ stockUnit }: Props) {
    return (
        <>
            <Head title="Detail Stok Unit" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/ecommerce/product-stock-units">
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

                    <Link
                        href={`/dashboard/ecommerce/product-stock-units/${stockUnit.id}/edit`}
                    >
                        <Button className="gap-2">
                            <Edit className="h-4 w-4" />
                            Edit
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-4 rounded-xl border bg-card p-6 shadow-sm md:grid-cols-2">
                    <Info
                        label="Product"
                        value={stockUnit.variant?.product?.name}
                    />
                    <Info
                        label="Product Variant"
                        value={stockUnit.variant?.name}
                    />
                    <Info label="SKU" value={stockUnit.variant?.sku} />
                    <Info
                        label="IMEI / Serial"
                        value={stockUnit.imei_serial_number}
                    />
                    <Info
                        label="Network"
                        value={networkLabel(stockUnit.network_compatibility)}
                    />
                    <Info label="Status" value={stockUnit.status} />
                    <div className="md:col-span-2">
                        <Info label="Note" value={stockUnit.note || '-'} />
                    </div>
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
