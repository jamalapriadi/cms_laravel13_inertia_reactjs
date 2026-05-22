import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import AppLayout from '@/layouts/master-data-layout';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { LaravelPagination } from '@/types/LaravelPagination';
import {
    Activity,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCw,
    Warehouse,
    Layers,
    Eye,
    Edit,
    Trash,
    Plus,
} from 'lucide-react';

interface VariantOption {
    id: string;
    name: string;
    sku: string;
    stock: number;
}

interface StockMovement {
    id: string;
    product_variant_id: string;
    product_stock_unit_id?: string | null;
    type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'cancel';
    qty: number;
    stock_before: number;
    stock_after: number;
    stock_unit_status_before?: string | null;
    stock_unit_status_after?: string | null;
    note: string | null;
    created_at: string;
    stock_unit?: {
        id: string;
        imei_serial_number: string;
        network_compatibility: string;
        status: string;
    } | null;
    variant?: {
        id: string;
        name: string;
        sku: string;
        product?: {
            id: string;
            name: string;
        };
    };
}

interface TypeDistributionItem {
    type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'cancel';
    count: number;
    total_qty: number;
}

interface TopActiveVariant {
    variant_id: string;
    sku: string;
    product_name: string;
    variant_name: string;
    count: number;
}

interface Props {
    movements: LaravelPagination<StockMovement>;
    variants: VariantOption[];
    summary: {
        total_movements: number;
        stock_in: number;
        stock_out: number;
        net_change: number;
        type_distribution: TypeDistributionItem[];
        top_active_variants: TopActiveVariant[];
    };
    filters: {
        search?: string;
        type?: string;
        product_variant_id?: string;
    };
}

export default function Index({
    movements,
    variants,
    summary,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || '');
    const [variantId, setVariantId] = useState(
        filters.product_variant_id || '',
    );
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const applyFilter = () => {
        router.get(
            '/dashboard/ecommerce/stock-movements',
            {
                search,
                type,
                product_variant_id: variantId,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearFilter = () => {
        setSearch('');
        setType('');
        setVariantId('');
        router.get(
            '/dashboard/ecommerce/stock-movements',
            {},
            { replace: true },
        );
    };

    const handleDelete = () => {
        if (!deletingId) return;
        router.delete(`/dashboard/ecommerce/stock-movements/${deletingId}`, {
            onFinish: () => setDeletingId(null),
        });
    };

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

    const columns = [
        {
            label: 'Date & Time',
            render: (row: StockMovement) => (
                <div className="flex flex-col text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                        {new Date(row.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </span>
                    <span>
                        {new Date(row.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                </div>
            ),
        },
        {
            label: 'Product Variant',
            render: (row: StockMovement) => (
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                        {row.variant?.product?.name || 'Deleted Product'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {row.variant?.name || 'Default'} (SKU:{' '}
                        {row.variant?.sku || 'N/A'})
                    </span>
                </div>
            ),
        },
        {
            label: 'Type',
            render: (row: StockMovement) => (
                <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase ${getTypeColor(row.type)}`}
                >
                    {row.type}
                </span>
            ),
        },
        {
            label: 'Stock Unit',
            render: (row: StockMovement) => (
                <div className="flex flex-col text-xs">
                    <span className="font-mono font-semibold text-foreground">
                        {row.stock_unit?.imei_serial_number || '-'}
                    </span>
                    {row.stock_unit && (
                        <span className="text-muted-foreground">
                            {row.stock_unit.network_compatibility} ·{' '}
                            {row.stock_unit_status_before || '-'} →{' '}
                            {row.stock_unit_status_after || '-'}
                        </span>
                    )}
                </div>
            ),
        },
        {
            label: 'Quantity',
            render: (row: StockMovement) => {
                const isPositive = row.qty > 0;
                return (
                    <span
                        className={`text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                        {isPositive ? `+${row.qty}` : row.qty}
                    </span>
                );
            },
        },
        {
            label: 'Stock Transition',
            render: (row: StockMovement) => (
                <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-mono text-muted-foreground">
                        {row.stock_before}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-mono font-bold text-foreground">
                        {row.stock_after}
                    </span>
                </div>
            ),
        },
        {
            label: 'Note',
            render: (row: StockMovement) => (
                <span
                    className="block max-w-[200px] truncate text-xs text-muted-foreground"
                    title={row.note || ''}
                >
                    {row.note || '-'}
                </span>
            ),
        },
        {
            label: 'Actions',
            render: (row: StockMovement) => (
                <div className="flex items-center gap-2">
                    <Link
                        href={`/dashboard/ecommerce/stock-movements/${row.id}`}
                    >
                        <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 px-2"
                            title="View details"
                        >
                            <Eye className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                    <Link
                        href={`/dashboard/ecommerce/stock-movements/${row.id}/edit`}
                    >
                        <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 px-2"
                            title="Edit movement"
                        >
                            <Edit className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                    <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 px-2"
                        title="Delete movement"
                        onClick={() => setDeletingId(row.id)}
                    >
                        <Trash className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Stock Movements" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Stock Movements
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Monitor inventory transitions, log adjustments, and
                            track stock changes.
                        </p>
                    </div>

                    <Link href="/dashboard/ecommerce/stock-movements/create">
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add Movement
                        </Button>
                    </Link>
                </div>

                <hr className="border-border" />

                {/* SUMMARY CARDS */}
                <div className="grid gap-6 md:grid-cols-4">
                    <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Total Logs
                            </span>
                            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                                <Activity className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-extrabold tracking-tight">
                                {summary.total_movements}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Logged transitions
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Stock Inward
                            </span>
                            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                                <ArrowUpRight className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-extrabold tracking-tight text-emerald-600">
                                +{summary.stock_in}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Purchases, returns, adjustments
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Stock Outward
                            </span>
                            <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                                <ArrowDownLeft className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-extrabold tracking-tight text-rose-600">
                                -{summary.stock_out}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Sales and adjustments
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Net Stock Change
                            </span>
                            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                                <Warehouse className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3
                                className={`text-3xl font-extrabold tracking-tight ${summary.net_change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                            >
                                {summary.net_change >= 0
                                    ? `+${summary.net_change}`
                                    : summary.net_change}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Cumulative stock flux
                            </p>
                        </div>
                    </div>
                </div>

                {/* GRAPH & TOP LIST SECTION */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* TYPE DISTRIBUTION */}
                    <div className="rounded-xl border border-border bg-card p-5 shadow-sm md:col-span-2">
                        <h3 className="mb-4 font-bold text-foreground">
                            Movement Type Distribution
                        </h3>
                        <div className="space-y-4">
                            {summary.type_distribution.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    No movement data recorded yet.
                                </p>
                            ) : (
                                summary.type_distribution.map((item) => {
                                    const percentage =
                                        summary.total_movements > 0
                                            ? (item.count /
                                                  summary.total_movements) *
                                              100
                                            : 0;
                                    return (
                                        <div
                                            key={item.type}
                                            className="space-y-1.5"
                                        >
                                            <div className="flex justify-between text-xs font-semibold">
                                                <span className="text-muted-foreground uppercase">
                                                    {item.type}
                                                </span>
                                                <span className="text-foreground">
                                                    {item.count} logs (
                                                    {item.total_qty >= 0
                                                        ? `+${item.total_qty}`
                                                        : item.total_qty}{' '}
                                                    units)
                                                </span>
                                            </div>
                                            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        item.type === 'purchase'
                                                            ? 'bg-emerald-500'
                                                            : item.type ===
                                                                'sale'
                                                              ? 'bg-rose-500'
                                                              : item.type ===
                                                                  'adjustment'
                                                                ? 'bg-amber-500'
                                                                : 'bg-blue-500'
                                                    }`}
                                                    style={{
                                                        width: `${percentage}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* TOP ACTIVE ITEMS */}
                    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                        <h3 className="mb-4 font-bold text-foreground">
                            Top Active Variants
                        </h3>
                        <div className="divide-y divide-border">
                            {summary.top_active_variants.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    No variant activity recorded.
                                </p>
                            ) : (
                                summary.top_active_variants.map((v, i) => (
                                    <div
                                        key={v.variant_id}
                                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">
                                                {i + 1}
                                            </div>
                                            <div className="flex flex-col">
                                                <span
                                                    className="max-w-[150px] truncate text-sm font-semibold text-foreground"
                                                    title={v.product_name}
                                                >
                                                    {v.product_name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {v.variant_name} ({v.sku})
                                                </span>
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">
                                            <Layers className="h-3 w-3" />
                                            {v.count} logs
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* FILTER TOOLBAR */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-slate-50/50 p-4 dark:bg-slate-900/10">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative max-w-xs">
                            <Input
                                placeholder="Search by SKU, product name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-[260px] pl-9"
                                onKeyDown={(e) =>
                                    e.key === 'Enter' && applyFilter()
                                }
                            />
                            <div className="absolute top-3 left-3 text-muted-foreground">
                                <Activity className="h-4 w-4" />
                            </div>
                        </div>

                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                            <option value="">All Types</option>
                            <option value="purchase">Purchase</option>
                            <option value="sale">Sale</option>
                            <option value="adjustment">Adjustment</option>
                            <option value="return">Return</option>
                            <option value="cancel">Cancel</option>
                        </select>

                        <select
                            value={variantId}
                            onChange={(e) => setVariantId(e.target.value)}
                            className="flex h-10 max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                            <option value="">All Variants</option>
                            {variants.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.sku} - {v.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={clearFilter}
                            className="flex items-center gap-1"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Clear
                        </Button>
                        <Button onClick={applyFilter}>Apply Filters</Button>
                    </div>
                </div>

                {/* TABLE CONTAINER */}
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <DataTable<StockMovement>
                        data={movements.data}
                        columns={columns}
                    />
                </div>

                {/* PAGINATION */}
                {movements.links && movements.links.length > 3 && (
                    <div className="flex flex-wrap justify-center gap-1.5">
                        {movements.links.map((link, i) => (
                            <button
                                key={i}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                disabled={!link.url}
                                onClick={() =>
                                    link.url && router.visit(link.url)
                                }
                                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                                    link.active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'border border-border bg-background text-foreground hover:bg-muted'
                                } ${!link.url && 'cursor-not-allowed opacity-40'}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* DELETE ALERT DIALOG */}
            <AlertDialog
                open={!!deletingId}
                onOpenChange={() => setDeletingId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete Stock Movement Log?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Warning: This action will delete the movement record
                            and **automatically recalculate** the associated
                            variant's stock level to reverse this movement's
                            effect.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Confirm Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
