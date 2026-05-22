import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
// import AppLayout from '@/layouts/master-data-layout';

interface OrderItem {
    id: string;
    product_name: string;
    variant_name?: string | null;
    price: string | number;
    qty: number;
    subtotal: string | number;
    product?: {
        name: string;
    } | null;
    variant?: {
        name: string;
    } | null;
}

interface Payment {
    id: string;
    payment_method: string;
    amount: string | number;
    status: string;
    created_at: string;
}

interface Order {
    id: string;
    invoice_number: string;
    customer_name: string;
    customer_email?: string | null;
    customer_phone?: string | null;
    shipping_address?: string | null;
    subtotal: string | number;
    shipping_cost: string | number;
    discount: string | number;
    grand_total: string | number;
    payment_status: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';
    status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
    paid_at?: string | null;
    created_at: string;
    items: OrderItem[];
    payments: Payment[];
}

interface Props {
    order: Order;
}

export default function Show({ order }: Props) {
    const { data, setData, put, processing } = useForm({
        status: order.status,
        payment_status: order.payment_status,
    });

    const handleUpdateStatus = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/dashboard/orders/${order.id}`);
    };

    const handlePrintReceipt = () => {
        window.open(`/dashboard/orders/${order.id}/receipt`, '_blank');
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

    return (
        <>
            <Head title={`Order ${order.invoice_number}`} />

            <div className="container mx-auto space-y-8 px-4 py-6">
                {/* BREADCRUMB / BACK LINK */}
                <div className="flex items-center justify-between">
                    <Link href="/dashboard/orders">
                        <Button variant="outline" size="sm">
                            &larr; Back to Orders
                        </Button>
                    </Link>

                    <Button
                        onClick={handlePrintReceipt}
                        className="bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/95"
                    >
                        Print Receipt (Cetak Resi)
                    </Button>
                </div>

                {/* ORDER HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                                {order.invoice_number}
                            </h1>
                            <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${getOrderStatusStyles(order.status)}`}
                            >
                                {order.status}
                            </span>
                            <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase ${getPaymentStatusStyles(order.payment_status)}`}
                            >
                                {order.payment_status}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Placed on{' '}
                            {new Date(order.created_at).toLocaleDateString(
                                'id-ID',
                                {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                },
                            )}
                        </p>
                    </div>
                </div>

                {/* TWO-COLUMN GRID */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* LEFT COLUMN: Customer and Items Details */}
                    <div className="space-y-8 lg:col-span-2">
                        {/* CUSTOMER INFORMATION CARD */}
                        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-foreground">
                                Customer Information
                            </h2>
                            <hr className="border-border" />
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-1">
                                    <span className="block text-xs text-muted-foreground">
                                        Customer Name
                                    </span>
                                    <span className="text-sm font-semibold text-foreground">
                                        {order.customer_name}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-xs text-muted-foreground">
                                        Email Address
                                    </span>
                                    <span className="text-sm text-foreground">
                                        {order.customer_email || '-'}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-xs text-muted-foreground">
                                        Phone Number
                                    </span>
                                    <span className="text-sm text-foreground">
                                        {order.customer_phone || '-'}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-xs text-muted-foreground">
                                        Paid Date/Time
                                    </span>
                                    <span className="text-sm text-foreground">
                                        {order.paid_at
                                            ? new Date(
                                                  order.paid_at,
                                              ).toLocaleDateString('id-ID', {
                                                  year: 'numeric',
                                                  month: 'short',
                                                  day: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                              })
                                            : 'Unpaid / Pending'}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-2 space-y-1">
                                <span className="block text-xs text-muted-foreground">
                                    Shipping Address
                                </span>
                                <span className="text-sm leading-relaxed whitespace-pre-line text-foreground">
                                    {order.shipping_address ||
                                        'No shipping address provided.'}
                                </span>
                            </div>
                        </div>

                        {/* ORDER ITEMS CARD */}
                        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-foreground">
                                Products Ordered
                            </h2>
                            <hr className="border-border" />
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b text-xs tracking-wider text-muted-foreground uppercase">
                                            <th className="py-3 pr-4 font-semibold">
                                                Product Name
                                            </th>
                                            <th className="px-4 py-3 text-right font-semibold">
                                                Price
                                            </th>
                                            <th className="px-4 py-3 text-center font-semibold">
                                                Qty
                                            </th>
                                            <th className="py-3 pl-4 text-right font-semibold">
                                                Subtotal
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {order.items.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="text-sm"
                                            >
                                                <td className="py-4 pr-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground">
                                                            {item.product_name}
                                                        </span>
                                                        {item.variant_name && (
                                                            <span className="mt-0.5 text-xs text-muted-foreground">
                                                                Variant:{' '}
                                                                {
                                                                    item.variant_name
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right font-medium text-foreground">
                                                    Rp{' '}
                                                    {Number(
                                                        item.price,
                                                    ).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-4 py-4 text-center text-muted-foreground">
                                                    {item.qty}
                                                </td>
                                                <td className="py-4 pl-4 text-right font-semibold text-foreground">
                                                    Rp{' '}
                                                    {Number(
                                                        item.subtotal,
                                                    ).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Action Forms and Pricing summary */}
                    <div className="space-y-8">
                        {/* UPDATE ORDER STATUS CARD */}
                        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-foreground">
                                Update Order State
                            </h2>
                            <hr className="border-border" />
                            <form
                                onSubmit={handleUpdateStatus}
                                className="space-y-4"
                            >
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Order Status
                                    </label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        value={data.status}
                                        onChange={(e) =>
                                            setData(
                                                'status',
                                                e.target.value as any,
                                            )
                                        }
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="processing">
                                            Processing
                                        </option>
                                        <option value="shipped">Shipped</option>
                                        <option value="completed">
                                            Completed
                                        </option>
                                        <option value="cancelled">
                                            Cancelled
                                        </option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Payment Status
                                    </label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        value={data.payment_status}
                                        onChange={(e) =>
                                            setData(
                                                'payment_status',
                                                e.target.value as any,
                                            )
                                        }
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="failed">Failed</option>
                                        <option value="expired">Expired</option>
                                        <option value="refunded">
                                            Refunded
                                        </option>
                                    </select>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full shadow-sm"
                                >
                                    {processing
                                        ? 'Saving Changes...'
                                        : 'Save Order Changes'}
                                </Button>
                            </form>
                        </div>

                        {/* ORDER TOTALS CARD */}
                        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-foreground">
                                Financial Summary
                            </h2>
                            <hr className="border-border" />
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span className="font-medium text-foreground">
                                        Rp{' '}
                                        {Number(order.subtotal).toLocaleString(
                                            'id-ID',
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Shipping Cost</span>
                                    <span className="font-medium text-foreground">
                                        Rp{' '}
                                        {Number(
                                            order.shipping_cost,
                                        ).toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Discounts</span>
                                    <span className="font-medium text-rose-700 dark:text-rose-300">
                                        - Rp{' '}
                                        {Number(order.discount).toLocaleString(
                                            'id-ID',
                                        )}
                                    </span>
                                </div>
                                <hr className="my-1 border-border" />
                                <div className="flex items-baseline justify-between pt-1 text-foreground">
                                    <span className="text-base font-bold">
                                        Grand Total
                                    </span>
                                    <span className="text-xl font-extrabold text-primary">
                                        Rp{' '}
                                        {Number(
                                            order.grand_total,
                                        ).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
