import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/master-data-layout';
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
    Truck,
    Clock,
    Compass,
    CheckCircle2,
    DollarSign,
    RefreshCw,
    Layers,
    Eye,
    Edit,
    Trash,
    Plus,
    Search,
} from 'lucide-react';

interface OrderInfo {
    id: string;
    invoice_number: string;
    customer_name: string;
    shipping_address: string | null;
}

interface Shipping {
    id: string;
    order_id: string;
    courier: string;
    tracking_number: string | null;
    status:
        | 'pending'
        | 'processing'
        | 'shipped'
        | 'delivered'
        | 'failed'
        | 'returned';
    shipping_cost: number;
    shipping_address: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
    created_at: string;
    order?: OrderInfo;
}

interface CourierDistributionItem {
    courier: string;
    count: number;
    total_cost: number;
}

interface StatusDistributionItem {
    status:
        | 'pending'
        | 'processing'
        | 'shipped'
        | 'delivered'
        | 'failed'
        | 'returned';
    count: number;
}

interface Props {
    shippings: LaravelPagination<Shipping>;
    couriers: string[];
    summary: {
        total_shipments: number;
        pending_shipments: number;
        shipped_shipments: number;
        delivered_shipments: number;
        total_cost: number;
        courier_distribution: CourierDistributionItem[];
        status_distribution: StatusDistributionItem[];
    };
    filters: {
        search?: string;
        status?: string;
        courier?: string;
    };
}

export default function Index({
    shippings,
    couriers,
    summary,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [courier, setCourier] = useState(filters.courier || '');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const applyFilter = () => {
        router.get(
            '/dashboard/ecommerce/shipping',
            {
                search,
                status,
                courier,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearFilter = () => {
        setSearch('');
        setStatus('');
        setCourier('');
        router.get('/dashboard/ecommerce/shipping', {}, { replace: true });
    };

    const handleDelete = () => {
        if (!deletingId) return;
        router.delete(`/dashboard/ecommerce/shipping/${deletingId}`, {
            onFinish: () => setDeletingId(null),
        });
    };

    const getStatusColor = (shippingStatus: string) => {
        switch (shippingStatus) {
            case 'pending':
                return 'bg-slate-50 text-slate-700 border-slate-200';
            case 'processing':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'shipped':
                return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            case 'delivered':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'failed':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'returned':
                return 'bg-orange-50 text-orange-700 border-orange-200';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const columns = [
        {
            label: 'Order Info',
            render: (row: Shipping) => (
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                        {row.order?.invoice_number || 'N/A'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {row.order?.customer_name || 'Walk-in Customer'}
                    </span>
                </div>
            ),
        },
        {
            label: 'Courier & Resi',
            render: (row: Shipping) => (
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground uppercase">
                        {row.courier}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                        {row.tracking_number || 'No Tracking Resi'}
                    </span>
                </div>
            ),
        },
        {
            label: 'Cost',
            render: (row: Shipping) => (
                <span className="text-sm font-medium text-foreground">
                    Rp {Number(row.shipping_cost).toLocaleString('id-ID')}
                </span>
            ),
        },
        {
            label: 'Status',
            render: (row: Shipping) => (
                <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase ${getStatusColor(row.status)}`}
                >
                    {row.status}
                </span>
            ),
        },
        {
            label: 'Dates',
            render: (row: Shipping) => (
                <div className="flex flex-col text-xs text-muted-foreground">
                    {row.shipped_at && (
                        <span>
                            Shipped:{' '}
                            {new Date(row.shipped_at).toLocaleDateString(
                                'id-ID',
                                { day: '2-digit', month: 'short' },
                            )}
                        </span>
                    )}
                    {row.delivered_at && (
                        <span>
                            Delivered:{' '}
                            {new Date(row.delivered_at).toLocaleDateString(
                                'id-ID',
                                { day: '2-digit', month: 'short' },
                            )}
                        </span>
                    )}
                    {!row.shipped_at && !row.delivered_at && <span>-</span>}
                </div>
            ),
        },
        {
            label: 'Actions',
            render: (row: Shipping) => (
                <div className="flex items-center gap-2">
                    <Link href={`/dashboard/ecommerce/shipping/${row.id}`}>
                        <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 px-2"
                            title="View details"
                        >
                            <Eye className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                    <Link href={`/dashboard/ecommerce/shipping/${row.id}/edit`}>
                        <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 px-2"
                            title="Edit shipment"
                        >
                            <Edit className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                    <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 px-2"
                        title="Delete shipment"
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
            <Head title="Shipping Management" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Shipping Management
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Manage logistics, track delivery status, and review
                            courier performance.
                        </p>
                    </div>

                    <Link href="/dashboard/ecommerce/shipping/create">
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add Shipment
                        </Button>
                    </Link>
                </div>

                <hr className="border-border" />

                {/* SUMMARY CARDS */}
                <div className="grid gap-6 md:grid-cols-5">
                    <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Total Shipments
                            </span>
                            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                                <Truck className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-extrabold tracking-tight">
                                {summary.total_shipments}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Dispatched orders
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Pending/Processing
                            </span>
                            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                                <Clock className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-extrabold tracking-tight text-amber-600">
                                {summary.pending_shipments}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Awaiting dispatch
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                In Transit
                            </span>
                            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                                <Compass className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-extrabold tracking-tight text-indigo-600">
                                {summary.shipped_shipments}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Out with couriers
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Delivered
                            </span>
                            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-extrabold tracking-tight text-emerald-600">
                                {summary.delivered_shipments}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Arrived safely
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Total Costs
                            </span>
                            <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                                <DollarSign className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3
                                className="truncate text-2xl font-extrabold tracking-tight"
                                title={`Rp ${summary.total_cost.toLocaleString('id-ID')}`}
                            >
                                Rp {summary.total_cost.toLocaleString('id-ID')}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Logistics expenditure
                            </p>
                        </div>
                    </div>
                </div>

                {/* VISUAL ANALYTICS SECTION */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* STATUS DISTRIBUTION */}
                    <div className="rounded-xl border border-border bg-card p-5 shadow-sm md:col-span-2">
                        <h3 className="mb-4 font-bold text-foreground">
                            Delivery Status Distribution
                        </h3>
                        <div className="space-y-4">
                            {summary.status_distribution.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    No shipping logs registered yet.
                                </p>
                            ) : (
                                summary.status_distribution.map((item) => {
                                    const percentage =
                                        summary.total_shipments > 0
                                            ? (item.count /
                                                  summary.total_shipments) *
                                              100
                                            : 0;
                                    return (
                                        <div
                                            key={item.status}
                                            className="space-y-1.5"
                                        >
                                            <div className="flex justify-between text-xs font-semibold">
                                                <span className="text-muted-foreground uppercase">
                                                    {item.status}
                                                </span>
                                                <span className="text-foreground">
                                                    {item.count} shipments (
                                                    {percentage.toFixed(1)}%)
                                                </span>
                                            </div>
                                            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        item.status ===
                                                        'delivered'
                                                            ? 'bg-emerald-500'
                                                            : item.status ===
                                                                'shipped'
                                                              ? 'bg-indigo-500'
                                                              : item.status ===
                                                                  'processing'
                                                                ? 'bg-amber-500'
                                                                : item.status ===
                                                                    'failed'
                                                                  ? 'bg-rose-500'
                                                                  : item.status ===
                                                                      'returned'
                                                                    ? 'bg-orange-500'
                                                                    : 'bg-slate-400'
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

                    {/* COURIER PERFORMANCE */}
                    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                        <h3 className="mb-4 font-bold text-foreground">
                            Courier Distribution
                        </h3>
                        <div className="divide-y divide-border">
                            {summary.courier_distribution.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    No courier records.
                                </p>
                            ) : (
                                summary.courier_distribution.map((c, i) => (
                                    <div
                                        key={c.courier}
                                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-foreground uppercase">
                                                {c.courier}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                Rp{' '}
                                                {c.total_cost.toLocaleString(
                                                    'id-ID',
                                                )}{' '}
                                                total
                                            </span>
                                        </div>
                                        <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                                            <Layers className="h-3 w-3" />
                                            {c.count} packages
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
                        <div className="relative">
                            <Input
                                placeholder="Search Invoice, Customer, Resi..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-[280px] pl-9"
                                onKeyDown={(e) =>
                                    e.key === 'Enter' && applyFilter()
                                }
                            />
                            <div className="absolute top-3 left-3 text-muted-foreground">
                                <Search className="h-4 w-4" />
                            </div>
                        </div>

                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="failed">Failed</option>
                            <option value="returned">Returned</option>
                        </select>

                        <select
                            value={courier}
                            onChange={(e) => setCourier(e.target.value)}
                            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                            <option value="">All Couriers</option>
                            {couriers.map((c) => (
                                <option key={c} value={c}>
                                    {c.toUpperCase()}
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
                    <DataTable<Shipping>
                        data={shippings.data}
                        columns={columns}
                    />
                </div>

                {/* PAGINATION */}
                {shippings.links && shippings.links.length > 3 && (
                    <div className="flex flex-wrap justify-center gap-1.5">
                        {shippings.links.map((link, i) => (
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
                            Delete Shipping Record?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this shipping
                            record? This action cannot be undone.
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
