import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/master-data-layout';
import type { LaravelPagination } from '@/types/LaravelPagination';

interface Payment {
    id: string;
    order_id: string;
    payment_method: string;
    transaction_id: string | null;
    amount: number;
    status: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';
    payload: any;
    paid_at: string | null;
    created_at: string;
    updated_at: string;
    order?: {
        id: string;
        invoice_number: string;
        customer_name: string;
        customer_email: string;
    } | null;
}

interface MethodStat {
    method: string;
    count: number;
    total: number;
}

interface StatusStat {
    status: string;
    count: number;
    total: number;
}

interface Summary {
    total_payments: number;
    total_revenue: number;
    pending_amount: number;
    refunded_amount: number;
    success_rate: number;
    method_distribution: MethodStat[];
    status_distribution: StatusStat[];
}

interface Props {
    payments: LaravelPagination<Payment>;
    summary: Summary;
    filters: {
        search?: string;
        status?: string;
        payment_method?: string;
    };
}

export default function Index({ payments, summary, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [method, setMethod] = useState(filters.payment_method || '');

    const applyFilter = () => {
        router.get(
            '/dashboard/ecommerce/payments',
            {
                search,
                status,
                payment_method: method,
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
        setMethod('');
        router.get(
            '/dashboard/ecommerce/payments',
            {},
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'pending':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'failed':
            case 'expired':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'refunded':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const formatMethodLabel = (method: string) => {
        return method
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const columns = [
        {
            label: 'Transaction / Date',
            render: (row: Payment) => (
                <div className="flex flex-col">
                    <span className="font-mono text-xs font-semibold text-foreground truncate max-w-[120px]">
                        {row.transaction_id || row.id.substring(0, 8) + '...'}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(row.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                </div>
            ),
        },
        {
            label: 'Invoice',
            render: (row: Payment) => (
                row.order ? (
                    <Link
                        href={`/dashboard/orders/${row.order.id}`}
                        className="text-sm font-semibold text-primary hover:underline"
                    >
                        {row.order.invoice_number}
                    </Link>
                ) : (
                    <span className="text-xs text-muted-foreground italic">N/A</span>
                )
            ),
        },
        {
            label: 'Customer',
            render: (row: Payment) => (
                row.order ? (
                    <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">{row.order.customer_name}</span>
                        <span className="text-xs text-muted-foreground">{row.order.customer_email}</span>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground italic">N/A</span>
                )
            ),
        },
        {
            label: 'Method',
            render: (row: Payment) => (
                <span className="text-sm font-medium text-foreground">
                    {formatMethodLabel(row.payment_method)}
                </span>
            ),
        },
        {
            label: 'Amount',
            render: (row: Payment) => (
                <span className="text-sm font-semibold text-foreground">
                    Rp {Number(row.amount).toLocaleString('id-ID')}
                </span>
            ),
        },
        {
            label: 'Status',
            render: (row: Payment) => (
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${getStatusStyles(row.status)}`}>
                    {row.status.toUpperCase()}
                </span>
            ),
        },
        {
            label: 'Actions',
            render: (row: Payment) => (
                <Link href={`/dashboard/ecommerce/payments/${row.id}`}>
                    <Button size="sm" variant="outline" className="border-primary/50 text-primary hover:bg-primary/5">
                        Details
                    </Button>
                </Link>
            ),
        },
    ];

    const maxMethodCount = summary.method_distribution.length > 0
        ? Math.max(...summary.method_distribution.map((m) => m.count))
        : 1;

    const maxStatusCount = summary.status_distribution.length > 0
        ? Math.max(...summary.status_distribution.map((s) => s.count))
        : 1;

    return (
        <AppLayout>
            <Head title="Payments Overview" />

            <div className="container mx-auto space-y-8 px-4 py-6">
                {/* TITLE & HEADER */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Payment Transactions</h1>
                    <p className="text-muted-foreground text-sm">
                        Track payments, analyze checkout conversion rates, and audit financial gateway logs.
                    </p>
                </div>

                <hr className="border-slate-100" />

                {/* INSIGHTS METRICS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* TOTAL REVENUE */}
                    <div className="rounded-xl border bg-card p-5 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 h-16 w-16 bg-emerald-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Revenue Collected</span>
                        <div className="flex flex-col mt-2">
                            <span className="text-2xl font-bold tracking-tight text-emerald-600">
                                Rp {summary.total_revenue.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">from successful payments</span>
                        </div>
                    </div>

                    {/* TOTAL TRANSACTIONS */}
                    <div className="rounded-xl border bg-card p-5 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 h-16 w-16 bg-primary/5 rounded-bl-full transition-transform group-hover:scale-110" />
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Transactions</span>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-3xl font-bold tracking-tight text-foreground">{summary.total_payments}</span>
                            <span className="text-xs text-muted-foreground">invoices</span>
                        </div>
                    </div>

                    {/* SUCCESS CONVERSION RATE */}
                    <div className="rounded-xl border bg-card p-5 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 h-16 w-16 bg-blue-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Success Rate</span>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-3xl font-bold tracking-tight text-blue-600">
                                {summary.success_rate}%
                            </span>
                            <span className="text-xs text-muted-foreground">
                                conversion
                            </span>
                        </div>
                    </div>

                    {/* REFUNDED / PENDING */}
                    <div className="rounded-xl border bg-card p-5 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 h-16 w-16 bg-amber-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending / Refunded</span>
                        <div className="flex flex-col mt-2">
                            <div className="flex justify-between items-baseline">
                                <span className="text-xs text-muted-foreground">Pending:</span>
                                <span className="text-sm font-semibold text-amber-600">Rp {summary.pending_amount.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between items-baseline mt-1">
                                <span className="text-xs text-muted-foreground">Refunded:</span>
                                <span className="text-sm font-semibold text-slate-600">Rp {summary.refunded_amount.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* FILTERS & PAYMENTS TABLE */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Filter Payments</h2>
                            <div className="flex flex-wrap gap-3 items-end">
                                <div className="flex-1 min-w-[200px] space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">Search</label>
                                    <Input
                                        placeholder="Invoice, transaction ID, customer name..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                                    />
                                </div>

                                <div className="w-[150px] space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">Status</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="failed">Failed</option>
                                        <option value="expired">Expired</option>
                                        <option value="refunded">Refunded</option>
                                    </select>
                                </div>

                                <div className="w-[180px] space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">Payment Method</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={method}
                                        onChange={(e) => setMethod(e.target.value)}
                                    >
                                        <option value="">All Methods</option>
                                        {summary.method_distribution.map((m) => (
                                            <option key={m.method} value={m.method}>
                                                {formatMethodLabel(m.method)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-2">
                                    <Button onClick={applyFilter} className="shadow-sm">
                                        Apply Filter
                                    </Button>
                                    {(filters.search || filters.status || filters.payment_method) && (
                                        <Button onClick={clearFilter} variant="outline">
                                            Reset
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* PAYMENTS TABLE */}
                        <div className="rounded-xl border bg-card p-1 shadow-sm overflow-hidden">
                            <DataTable<Payment> data={payments.data} columns={columns} />
                        </div>

                        {/* PAGINATION */}
                        {payments.links.length > 3 && (
                            <div className="flex items-center justify-center gap-1.5">
                                {payments.links.map((link, idx) => (
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

                    {/* CHARTS / BREAKDOWN PANEL */}
                    <div className="space-y-6">
                        {/* PAYMENT METHODS */}
                        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-foreground tracking-tight">Payment Methods</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Volume distribution across payment methods.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {summary.method_distribution.length > 0 ? (
                                    summary.method_distribution.map((m) => {
                                        const percent = (m.count / maxMethodCount) * 100;
                                        return (
                                            <div key={m.method} className="space-y-1">
                                                <div className="flex justify-between items-baseline text-xs">
                                                    <span className="font-semibold text-foreground">
                                                        {formatMethodLabel(m.method)}
                                                    </span>
                                                    <div className="flex gap-2 text-muted-foreground font-medium shrink-0">
                                                        <span>{m.count} trx</span>
                                                        <span>•</span>
                                                        <span className="text-foreground">Rp {m.total.toLocaleString('id-ID')}</span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-primary h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                        No payment methods logged.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* TRANSACTION STATUSES */}
                        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-foreground tracking-tight">Transaction Statuses</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Distribution by transaction statuses.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {summary.status_distribution.length > 0 ? (
                                    summary.status_distribution.map((s) => {
                                        const percent = (s.count / maxStatusCount) * 100;
                                        
                                        let barColor = 'bg-slate-500';
                                        if (s.status === 'paid') {
                                            barColor = 'bg-emerald-500';
                                        } else if (s.status === 'pending') {
                                            barColor = 'bg-amber-500';
                                        } else if (s.status === 'failed' || s.status === 'expired') {
                                            barColor = 'bg-rose-500';
                                        } else if (s.status === 'refunded') {
                                            barColor = 'bg-blue-500';
                                        }

                                        return (
                                            <div key={s.status} className="space-y-1">
                                                <div className="flex justify-between items-baseline text-xs">
                                                    <span className="font-semibold text-foreground capitalize">
                                                        {s.status}
                                                    </span>
                                                    <div className="flex gap-2 text-muted-foreground font-medium shrink-0">
                                                        <span>{s.count} trx</span>
                                                        <span>•</span>
                                                        <span className="text-foreground">Rp {s.total.toLocaleString('id-ID')}</span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`${barColor} h-full rounded-full transition-all duration-500`}
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                        No status data logged.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
