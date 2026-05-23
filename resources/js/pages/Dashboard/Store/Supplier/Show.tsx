import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit } from 'lucide-react';

import { Button } from '@/components/ui/button';
// import AppLayout from '@/layouts/master-data-layout';

interface Supplier {
    id: string;
    name: string;
    code: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    is_active: boolean;
    incoming_goods_count?: number;
    returns_count?: number;
}

interface Props {
    supplier: Supplier;
}

export default function Show({ supplier }: Props) {
    return (
        <>
            <Head title="Detail Supplier" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/ecommerce/suppliers">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">
                                Detail Supplier
                            </h1>
                            <p className="font-mono text-sm text-muted-foreground">
                                {supplier.code}
                            </p>
                        </div>
                    </div>

                    <Link
                        href={`/dashboard/ecommerce/suppliers/${supplier.id}/edit`}
                    >
                        <Button className="gap-2">
                            <Edit className="h-4 w-4" />
                            Edit
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-4 rounded-xl border bg-card p-6 shadow-sm md:grid-cols-3">
                    <Info label="Nama" value={supplier.name} />
                    <Info label="Kode" value={supplier.code} />
                    <div>
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Status
                        </span>
                        <p className="mt-1">
                            <span
                                className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                                    supplier.is_active
                                        ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                                        : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                                }`}
                            >
                                {supplier.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </p>
                    </div>
                    <Info label="Phone" value={supplier.phone || '-'} />
                    <Info label="Email" value={supplier.email || '-'} />
                    <Info
                        label="Transaksi Barang Masuk"
                        value={String(supplier.incoming_goods_count ?? 0)}
                    />
                    <Info
                        label="Transaksi Retur"
                        value={String(supplier.returns_count ?? 0)}
                    />
                    <div className="md:col-span-3">
                        <Info label="Alamat" value={supplier.address || '-'} />
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
