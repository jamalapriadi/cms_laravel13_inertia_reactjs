import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { DataTable } from '@/components/DataTable';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { LaravelPagination } from '@/types/LaravelPagination';

interface Order {
    id: string;
    invoice_number: string;
    customer_name: string;
    customer_email?: string | null;
    customer_phone?: string | null;
    grand_total: string | number;
    payment_status: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';
    status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
    created_at: string;
}

interface Summary {
    total_orders: number;
    total_revenue: number;
    pending_orders: number;
    processing_orders: number;
    completed_orders: number;
}

interface Props {
    orders: LaravelPagination<Order>;
    summary: Summary;
    filters: {
        search?: string;
        status?: string;
        payment_status?: string;
    };
}

export default function Index({ orders, summary, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [paymentStatus, setPaymentStatus] = useState(
        filters.payment_status || '',
    );
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const applyFilter = () => {
        router.get(
            '/dashboard/orders',
            {
                search,
                status,
                payment_status: paymentStatus,
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
        setPaymentStatus('');
        router.get(
            '/dashboard/orders',
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDelete = () => {
        if (!deletingId) {
            return;
        }
        router.delete(`/dashboard/orders/${deletingId}`, {
            onFinish: () => setDeletingId(null),
        });
    };

    // Color helpers for Badges
    const getPaymentStatusStyles = (pmStatus: string) => {
        switch (pmStatus) {
            case 'paid':
                return 'border border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300';
            case 'pending':
                return 'border border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300';
            case 'failed':
            case 'expired':
                return 'border border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300';
            case 'refunded':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200';
            default:
                return 'bg-muted/50 text-foreground border border-border';
        }
    };

    const getOrderStatusStyles = (ordStatus: string) => {
        switch (ordStatus) {
            case 'completed':
                return 'bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-medium';
            case 'processing':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 font-medium';
            case 'shipped':
                return 'bg-indigo-100 text-indigo-800 font-medium dark:bg-indigo-950/40 dark:text-indigo-300';
            case 'pending':
                return 'bg-amber-100 text-amber-800 dark:text-amber-300 font-medium';
            case 'cancelled':
                return 'bg-rose-100 text-rose-800 dark:text-rose-300 font-medium';
            default:
                return 'bg-muted text-foreground font-medium';
        }
    };

    const columns = [
        {
            label: 'Invoice & Date',
            render: (row: Order) => (
                <div className="flex flex-col">
                    <span className="font-semibold tracking-tight text-foreground">
                        {row.invoice_number}
                    </span>
                    <span className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(row.created_at).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                </div>
            ),
        },
        {
            label: 'Customer',
            render: (row: Order) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                        {row.customer_name}
                    </span>
                    {row.customer_phone && (
                        <span className="mt-0.5 text-xs text-muted-foreground">
                            {row.customer_phone}
                        </span>
                    )}
                </div>
            ),
        },
        {
            label: 'Grand Total',
            render: (row: Order) => (
                <span className="text-sm font-semibold text-foreground">
                    Rp {Number(row.grand_total).toLocaleString('id-ID')}
                </span>
            ),
        },
        {
            label: 'Payment Status',
            render: (row: Order) => (
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wider uppercase ${getPaymentStatusStyles(row.payment_status)}`}
                >
                    {row.payment_status}
                </span>
            ),
        },
        {
            label: 'Order Status',
            render: (row: Order) => (
                <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${getOrderStatusStyles(row.status)}`}
                >
                    {row.status}
                </span>
            ),
        },
        {
            label: 'Actions',
            render: (row: Order) => (
                <div className="flex gap-2">
                    <Link href={`/dashboard/orders/${row.id}`}>
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-primary/50 text-primary hover:bg-primary/5"
                        >
                            Detail
                        </Button>
                    </Link>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletingId(row.id)}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Orders Dashboard" />

            <div className="container mx-auto space-y-8 px-4 py-6">
                {/* TITLE & HEADER */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                        Orders Management
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Monitor, filter, update statuses, and view receipt
                        reports for customer purchases.
                    </p>
                </div>

                <hr className="border-border" />

                {/* SUMMARY STATS DASHBOARD */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                    {/* TOTAL ORDERS */}
                    <div className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow">
                        <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-primary/5 transition-transform group-hover:scale-110" />
                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            Total Orders
                        </span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-foreground">
                                {summary.total_orders}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                orders
                            </span>
                        </div>
                    </div>

                    {/* TOTAL REVENUE */}
                    <div className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow">
                        <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-emerald-500/5 transition-transform group-hover:scale-110" />
                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            Total Paid Revenue
                        </span>
                        <div className="mt-2 flex flex-col">
                            <span className="text-xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
                                Rp{' '}
                                {summary.total_revenue.toLocaleString('id-ID')}
                            </span>
                            <span className="mt-0.5 text-[10px] text-muted-foreground">
                                from paid orders
                            </span>
                        </div>
                    </div>

                    {/* PENDING ORDERS */}
                    <div className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow">
                        <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-amber-500/5 transition-transform group-hover:scale-110" />
                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            Pending Orders
                        </span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-amber-700 dark:text-amber-300">
                                {summary.pending_orders}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                awaiting response
                            </span>
                        </div>
                    </div>

                    {/* PROCESSING ORDERS */}
                    <div className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow">
                        <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-blue-500/5 transition-transform group-hover:scale-110" />
                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            Processing Orders
                        </span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-blue-600">
                                {summary.processing_orders}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                in production
                            </span>
                        </div>
                    </div>

                    {/* COMPLETED ORDERS */}
                    <div className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow">
                        <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-emerald-500/5 transition-transform group-hover:scale-110" />
                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            Completed Orders
                        </span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
                                {summary.completed_orders}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                successfully sent
                            </span>
                        </div>
                    </div>
                </div>

                {/* FILTERS SECTION */}
                <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
                    <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                        Search and Filter
                    </h2>
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[250px] flex-1 space-y-1.5">
                            <label className="text-xs font-medium text-foreground">
                                Invoice or Customer Name
                            </label>
                            <Input
                                placeholder="Search e.g. INV-12345..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === 'Enter' && applyFilter()
                                }
                            />
                        </div>

                        <div className="w-[180px] space-y-1.5">
                            <label className="text-xs font-medium text-foreground">
                                Order Status
                            </label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div className="w-[180px] space-y-1.5">
                            <label className="text-xs font-medium text-foreground">
                                Payment Status
                            </label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                value={paymentStatus}
                                onChange={(e) =>
                                    setPaymentStatus(e.target.value)
                                }
                            >
                                <option value="">All Payments</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="failed">Failed</option>
                                <option value="expired">Expired</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={applyFilter} className="shadow-sm">
                                Apply Filter
                            </Button>
                            {(filters.search ||
                                filters.status ||
                                filters.payment_status) && (
                                <Button onClick={clearFilter} variant="outline">
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ORDERS DATA TABLE */}
                <div className="overflow-hidden rounded-xl border bg-card p-1 shadow-sm">
                    <DataTable<Order> data={orders.data} columns={columns} />
                </div>

                {/* PAGINATION */}
                {orders.links.length > 3 && (
                    <div className="mt-6 flex items-center justify-center gap-1.5">
                        {orders.links.map((link, idx) => (
                            <button
                                key={idx}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                disabled={!link.url}
                                onClick={() =>
                                    link.url && router.visit(link.url)
                                }
                                className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                                    link.active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-muted'
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
                            Delete Order Records?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete this
                            order? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
