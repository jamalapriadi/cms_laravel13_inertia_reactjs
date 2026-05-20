import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/master-data-layout';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Warehouse,
    Calendar,
    User,
    FileText,
    Layers,
    Tag,
    Scale,
} from 'lucide-react';

interface StockMovement {
    id: string;
    product_variant_id: string;
    type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'cancel';
    qty: number;
    stock_before: number;
    stock_after: number;
    note: string | null;
    created_at: string;
    variant?: {
        id: string;
        name: string;
        sku: string;
        stock: number;
        product?: {
            id: string;
            name: string;
        };
    };
}

interface Props {
    movement: StockMovement;
}

export default function Show({ movement }: Props) {
    const getTypeColor = (movementType: string) => {
        switch (movementType) {
            case 'purchase':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'return':
            case 'cancel':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'sale':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'adjustment':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    return (
        <>
            <Head title="Stock Movement Details" />

            <div className="container mx-auto max-w-4xl space-y-8 px-6 py-8">
                {/* HEADER */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/ecommerce/stock-movements">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Stock Movement Log Details
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Detailed transaction record for stock level
                            adjustments.
                        </p>
                    </div>
                </div>

                <hr className="border-border" />

                <div className="grid gap-6 md:grid-cols-3">
                    {/* LEFT PANEL - PRIMARY DETAILS */}
                    <div className="space-y-6 md:col-span-2">
                        {/* Transaction Card */}
                        <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
                                <div className="space-y-1">
                                    <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                        Log Reference ID
                                    </span>
                                    <p className="font-mono text-sm font-semibold text-foreground select-all">
                                        {movement.id}
                                    </p>
                                </div>
                                <span
                                    className={`inline-flex items-center rounded-md border px-3 py-1 text-xs font-semibold uppercase ${getTypeColor(movement.type)}`}
                                >
                                    {movement.type}
                                </span>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                        <div className="space-y-0.5">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                Logged At
                                            </span>
                                            <p className="text-sm font-semibold text-foreground">
                                                {new Date(
                                                    movement.created_at,
                                                ).toLocaleString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Scale className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                        <div className="space-y-0.5">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                Quantity Shift
                                            </span>
                                            <p
                                                className={`text-base font-bold ${movement.qty >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                                            >
                                                {movement.qty >= 0
                                                    ? `+${movement.qty}`
                                                    : movement.qty}{' '}
                                                units
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <Warehouse className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                        <div className="space-y-0.5">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                Stock Transition
                                            </span>
                                            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                                <span className="font-mono text-muted-foreground">
                                                    {movement.stock_before}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    →
                                                </span>
                                                <span className="font-mono font-bold text-foreground">
                                                    {movement.stock_after}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <User className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                        <div className="space-y-0.5">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                Authorized By
                                            </span>
                                            <p className="text-sm font-semibold text-foreground">
                                                System Operator
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Note Card */}
                        <div className="space-y-3 rounded-xl border border-border bg-card p-6 shadow-sm">
                            <h3 className="flex items-center gap-2 font-bold text-foreground">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                Notes & Explanations
                            </h3>
                            <p className="rounded-lg border bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 dark:bg-slate-900/40">
                                {movement.note ||
                                    'No notes were provided for this stock adjustment.'}
                            </p>
                        </div>
                    </div>

                    {/* RIGHT PANEL - RELATED PRODUCT */}
                    <div className="h-fit space-y-6 rounded-xl border border-border bg-card p-5 shadow-sm">
                        <h3 className="flex items-center gap-1.5 border-b border-border pb-3 font-bold text-foreground">
                            <Layers className="h-4 w-4 text-primary" />
                            Target Product Variant
                        </h3>

                        <div className="space-y-5">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Product Name
                                </span>
                                <p className="text-sm font-bold text-foreground">
                                    {movement.variant?.product?.name ||
                                        'Deleted Product'}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Variant Spec
                                </span>
                                <p className="text-sm font-semibold text-foreground">
                                    {movement.variant?.name || 'Default'}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    SKU
                                </span>
                                <p className="font-mono text-sm font-semibold text-foreground">
                                    {movement.variant?.sku || 'N/A'}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Current Shop Stock
                                </span>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="text-2xl font-black text-foreground">
                                        {movement.variant?.stock ?? 0}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        units left
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <Link
                                href={`/dashboard/ecommerce/stock-movements/${movement.id}/edit`}
                            >
                                <Button className="w-full">
                                    Edit Movement Record
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
