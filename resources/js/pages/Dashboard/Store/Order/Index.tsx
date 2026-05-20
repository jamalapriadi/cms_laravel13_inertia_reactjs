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
    const [paymentStatus, setPaymentStatus] = useState(filters.payment_status || '');
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
            }
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
            }
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
                return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case 'pending':
                return 'bg-amber-50 text-amber-700 border border-amber-200';
            case 'failed':
            case 'expired':
                return 'bg-rose-50 text-rose-700 border border-rose-200';
            case 'refunded':
                return 'bg-blue-50 text-blue-700 border border-blue-200';
            default:
                return 'bg-slate-50 text-slate-700 border border-slate-200';
        }
    };

    const getOrderStatusStyles = (ordStatus: string) => {
        switch (ordStatus) {
            case 'completed':
                return 'bg-emerald-100 text-emerald-800 font-medium';
            case 'processing':
                return 'bg-blue-100 text-blue-800 font-medium';
            case 'shipped':
                return 'bg-indigo-100 text-indigo-800 font-medium';
            case 'pending':
                return 'bg-amber-100 text-amber-800 font-medium';
            case 'cancelled':
                return 'bg-rose-100 text-rose-800 font-medium';
            default:
                return 'bg-slate-100 text-slate-800 font-medium';
        }
    };

    const columns = [
        {
            label: 'Invoice & Date',
            render: (row: Order) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-foreground tracking-tight">
                        {row.invoice_number}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">
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
                    <span className="font-medium text-sm text-foreground">{row.customer_name}</span>
                    {row.customer_phone && (
                        <span className="text-xs text-muted-foreground mt-0.5">{row.customer_phone}</span>
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
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${getPaymentStatusStyles(row.payment_status)}`}>
                    {row.payment_status}
                </span>
            ),
        },
        {
            label: 'Order Status',
            render: (row: Order) => (
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${getOrderStatusStyles(row.status)}`}>
                    {row.status}
                </span>
            ),
        },
        {
            label: 'Actions',
            render: (row: Order) => (
                <div className="flex gap-2">
                    <Link href={`/dashboard/orders/${row.id}`}>
                        <Button size="sm" variant="outline" className="border-primary/50 text-primary hover:bg-primary/5">
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
        <AppLayout>
            <Head title="Orders Dashboard" />

            <div className="container mx-auto space-y-8 px-4 py-6">
                {/* TITLE & HEADER */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Orders Management</h1>
                    <p className="text-muted-foreground text-sm">
                        Monitor, filter, update statuses, and view receipt reports for customer purchases.
                    </p>
                </div>

                <hr className="border-slate-100" />

                {/* SUMMARY STATS DASHBOARD */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* TOTAL ORDERS */}
                    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow transition-shadow relative overflow-hidden group">
                        <div className="absolute right-0 top-0 h-16 w-16 bg-primary/5 rounded-bl-full transition-transform group-hover:scale-110" />
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Orders</span>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-3xl font-bold tracking-tight text-foreground">{summary.total_orders}</span>
                            <span className="text-xs text-muted-foreground">orders</span>
                        </div>
                    </div>

                    {/* TOTAL REVENUE */}
                    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow transition-shadow relative overflow-hidden group">
                        <div className="absolute right-0 top-0 h-16 w-16 bg-emerald-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Paid Revenue</span>
                        <div className="flex flex-col mt-2">
                            <span className="text-xl font-bold tracking-tight text-emerald-600">
                                Rp {summary.total_revenue.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">from paid orders</span>
                        </div>
                    </div>

                    {/* PENDING ORDERS */}
                    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow transition-shadow relative overflow-hidden group">
                        <div className="absolute right-0 top-0 h-16 w-16 bg-amber-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending Orders</span>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-3xl font-bold tracking-tight text-amber-600">{summary.pending_orders}</span>
                            <span className="text-xs text-muted-foreground">awaiting response</span>
                        </div>
                    </div>

                    {/* PROCESSING ORDERS */}
                    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow transition-shadow relative overflow-hidden group">
                        <div className="absolute right-0 top-0 h-16 w-16 bg-blue-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Processing Orders</span>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-3xl font-bold tracking-tight text-blue-600">{summary.processing_orders}</span>
                            <span className="text-xs text-muted-foreground">in production</span>
                        </div>
                    </div>

                    {/* COMPLETED ORDERS */}
                    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow transition-shadow relative overflow-hidden group">
                        <div className="absolute right-0 top-0 h-16 w-16 bg-emerald-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Completed Orders</span>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-3xl font-bold tracking-tight text-emerald-600">{summary.completed_orders}</span>
                            <span className="text-xs text-muted-foreground">successfully sent</span>
                        </div>
                    </div>
                </div>

                {/* FILTERS SECTION */}
                <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Search and Filter</h2>
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[250px] space-y-1.5">
                            <label className="text-xs font-medium text-foreground">Invoice or Customer Name</label>
                            <Input
                                placeholder="Search e.g. INV-12345..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                            />
                        </div>

                        <div className="w-[180px] space-y-1.5">
                            <label className="text-xs font-medium text-foreground">Order Status</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                            <label className="text-xs font-medium text-foreground">Payment Status</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={paymentStatus}
                                onChange={(e) => setPaymentStatus(e.target.value)}
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
                            {(filters.search || filters.status || filters.payment_status) && (
                                <Button onClick={clearFilter} variant="outline">
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ORDERS DATA TABLE */}
                <div className="rounded-xl border bg-card p-1 shadow-sm overflow-hidden">
                    <DataTable<Order> data={orders.data} columns={columns} />
                </div>

                {/* PAGINATION */}
                {orders.links.length > 3 && (
                    <div className="flex items-center justify-center gap-1.5 mt-6">
                        {orders.links.map((link, idx) => (
                            <button
                                key={idx}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url)}
                                className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                                    link.active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted text-muted-foreground'
                                } ${!link.url && 'opacity-40 cursor-not-allowed'}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* DELETE ALERT DIALOG */}
            <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Order Records?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete this order? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
