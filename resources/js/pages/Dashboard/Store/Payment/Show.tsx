import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/master-data-layout';

interface OrderItem {
    id: string;
    product_name: string;
    price: number;
    qty: number;
    subtotal: number;
}

interface Order {
    id: string;
    invoice_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_address: string;
    subtotal: number;
    shipping_cost: number;
    discount: number;
    grand_total: number;
    items: OrderItem[];
}

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
    order?: Order | null;
}

interface Props {
    payment: Payment;
}

export default function Show({ payment }: Props) {
    const [copied, setCopied] = useState(false);
    const [showPayload, setShowPayload] = useState(false);

    const getStatusBanner = (status: string) => {
        switch (status) {
            case 'paid':
                return {
                    bg: 'bg-emerald-50 border-emerald-200',
                    text: 'text-emerald-800',
                    title: 'Payment Completed Successfully',
                    desc: payment.paid_at
                        ? `The checkout was paid on ${new Date(payment.paid_at).toLocaleString('id-ID')}`
                        : 'The payment was fully settled.',
                };
            case 'pending':
                return {
                    bg: 'bg-amber-50 border-amber-200',
                    text: 'text-amber-800',
                    title: 'Payment Awaiting Settlement',
                    desc: 'The customer has generated a token/checkout but payment is still pending confirmation.',
                };
            case 'failed':
            case 'expired':
                return {
                    bg: 'bg-rose-50 border-rose-200',
                    text: 'text-rose-800',
                    title: `Payment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                    desc: 'This transaction was cancelled, expired, or failed by the gateway/bank.',
                };
            case 'refunded':
                return {
                    bg: 'bg-blue-50 border-blue-200',
                    text: 'text-blue-800',
                    title: 'Payment Refunded',
                    desc: 'A refund transaction was processed for this order.',
                };
            default:
                return {
                    bg: 'bg-slate-50 border-slate-200',
                    text: 'text-slate-800',
                    title: 'Unknown Payment Status',
                    desc: 'The current status is unrecognized.',
                };
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'pending':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'failed':
            case 'expired':
                return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'refunded':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const formatMethodLabel = (method: string) => {
        return method
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const handleCopyPayload = () => {
        navigator.clipboard.writeText(JSON.stringify(payment.payload, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const banner = getStatusBanner(payment.status);

    return (
        <AppLayout>
            <Head title={`Payment Detail - ${payment.transaction_id || payment.id.substring(0, 8)}`} />

            <div className="container mx-auto space-y-6 px-4 py-6">
                {/* HEADER & NAVIGATION */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Link href="/dashboard/ecommerce/payments" className="hover:text-foreground hover:underline">
                                Payments
                            </Link>
                            <span>/</span>
                            <span className="font-mono text-[10px]">{payment.id}</span>
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                            <span>Transaction Detail</span>
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border ${getStatusBadge(payment.status)}`}>
                                {payment.status.toUpperCase()}
                            </span>
                        </h1>
                    </div>

                    <Link href="/dashboard/ecommerce/payments">
                        <Button variant="outline">
                            ← Back to Payments
                        </Button>
                    </Link>
                </div>

                {/* STATUS SUMMARY BANNER */}
                <div className={`rounded-xl border p-4 flex flex-col gap-1 ${banner.bg}`}>
                    <h3 className={`text-sm font-bold ${banner.text}`}>{banner.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{banner.desc}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT / MAIN COLUMN */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* PAYMENT INFORMATION */}
                        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                Transaction details
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground block">Transaction ID</span>
                                    <span className="text-sm font-mono font-semibold text-foreground">
                                        {payment.transaction_id || 'N/A'}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground block">Payment Method</span>
                                    <span className="text-sm font-medium text-foreground">
                                        {formatMethodLabel(payment.payment_method)}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground block">Settled Amount</span>
                                    <span className="text-base font-bold text-foreground">
                                        Rp {Number(payment.amount).toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground block">Created Date</span>
                                    <span className="text-sm font-medium text-foreground">
                                        {new Date(payment.created_at).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ORDER ITEMS LIST */}
                        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                Associated Order Items
                            </h2>
                            {payment.order ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b text-xs font-semibold text-muted-foreground">
                                                <th className="py-3">Product Name</th>
                                                <th className="py-3 text-right">Price</th>
                                                <th className="py-3 text-center">Qty</th>
                                                <th className="py-3 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y text-sm">
                                            {payment.order.items.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="py-3 font-medium text-foreground">{item.product_name}</td>
                                                    <td className="py-3 text-right text-muted-foreground">
                                                        Rp {Number(item.price).toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="py-3 text-center text-foreground">{item.qty}</td>
                                                    <td className="py-3 text-right font-semibold text-foreground">
                                                        Rp {Number(item.subtotal).toLocaleString('id-ID')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-sm text-muted-foreground">
                                    No order items linked to this payment log.
                                </div>
                            )}
                        </div>

                        {/* GATEWAY PAYLOAD INSPECTOR */}
                        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Gateway Payload Logs
                                </h2>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowPayload(!showPayload)}
                                >
                                    {showPayload ? 'Hide Logs' : 'View Payload Logs'}
                                </Button>
                            </div>
                            
                            {showPayload && (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">
                                            Raw API webhook or response payload returned by checkout gateway.
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 text-xs font-semibold hover:bg-slate-100"
                                            onClick={handleCopyPayload}
                                            disabled={!payment.payload}
                                        >
                                            {copied ? 'Copied!' : 'Copy to Clipboard'}
                                        </Button>
                                    </div>
                                    <div className="relative">
                                        {payment.payload ? (
                                            <pre className="bg-slate-950 text-slate-200 text-[11px] p-4 rounded-lg overflow-x-auto font-mono max-h-[300px] border border-slate-800 leading-relaxed">
                                                {JSON.stringify(payment.payload, null, 2)}
                                            </pre>
                                        ) : (
                                            <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg">
                                                No metadata payload stored for this payment.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                        {/* CUSTOMER & INVOICE CARD */}
                        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
                            <div>
                                <h2 className="text-base font-bold text-foreground tracking-tight">Order Context</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Detailed invoice mapping and customer profiles.
                                </p>
                            </div>

                            {payment.order ? (
                                <div className="space-y-4 text-xs divide-y divide-slate-100">
                                    {/* INVOICE LINK */}
                                    <div className="py-3 first:pt-0 space-y-1">
                                        <span className="text-muted-foreground uppercase tracking-wider block">Invoice ID</span>
                                        <Link
                                            href={`/dashboard/orders/${payment.order.id}`}
                                            className="text-sm font-bold text-primary hover:underline"
                                        >
                                            {payment.order.invoice_number}
                                        </Link>
                                    </div>

                                    {/* CUSTOMER INFORMATION */}
                                    <div className="py-3 space-y-2">
                                        <span className="text-muted-foreground uppercase tracking-wider block">Customer profile</span>
                                        <div className="space-y-1 text-foreground">
                                            <div className="font-semibold">{payment.order.customer_name}</div>
                                            <div className="text-muted-foreground">{payment.order.customer_email}</div>
                                            <div className="text-muted-foreground">{payment.order.customer_phone}</div>
                                        </div>
                                    </div>

                                    {/* SHIPPING ADDRESS */}
                                    <div className="py-3 space-y-1">
                                        <span className="text-muted-foreground uppercase tracking-wider block">Shipping Address</span>
                                        <p className="text-foreground leading-relaxed">{payment.order.shipping_address}</p>
                                    </div>

                                    {/* ORDER TOTAL SUMMARY */}
                                    <div className="py-3 space-y-2">
                                        <span className="text-muted-foreground uppercase tracking-wider block">Billing Summary</span>
                                        <div className="space-y-1.5 text-muted-foreground">
                                            <div className="flex justify-between">
                                                <span>Subtotal:</span>
                                                <span className="text-foreground">Rp {Number(payment.order.subtotal).toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Shipping Cost:</span>
                                                <span className="text-foreground">Rp {Number(payment.order.shipping_cost).toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="flex justify-between text-rose-600">
                                                <span>Discount:</span>
                                                <span>-Rp {Number(payment.order.discount).toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="flex justify-between text-sm font-bold text-foreground border-t pt-1.5">
                                                <span>Grand Total:</span>
                                                <span>Rp {Number(payment.order.grand_total).toLocaleString('id-ID')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-sm text-muted-foreground">
                                    No customer/order reference linked.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
