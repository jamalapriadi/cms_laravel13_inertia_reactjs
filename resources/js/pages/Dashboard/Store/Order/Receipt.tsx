import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface OrderItem {
    id: string;
    product_name: string;
    variant_name?: string | null;
    price: string | number;
    qty: number;
    subtotal: string | number;
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
    payment_status: string;
    status: string;
    created_at: string;
    items: OrderItem[];
}

interface Props {
    order: Order;
}

export default function Receipt({ order }: Props) {
    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-white p-6 md:p-12 text-slate-800">
            <Head title={`Receipt - ${order.invoice_number}`} />

            {/* PRINT TOOLBAR */}
            <div className="max-w-3xl mx-auto flex gap-3 print:hidden mb-8 bg-slate-50 border p-4 rounded-xl items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                    Receipt print preview. This toolbar will be hidden in the printout.
                </span>
                <div className="flex gap-2">
                    <Button size="sm" onClick={() => window.print()}>
                        Print
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => window.close()}>
                        Close
                    </Button>
                </div>
            </div>

            {/* RECEIPT CONTENT BOX */}
            <div className="max-w-3xl mx-auto border border-slate-200 rounded-2xl p-8 md:p-12 bg-white shadow-sm print:border-none print:shadow-none print:p-0">
                {/* HEADER */}
                <div className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-100 pb-8">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black uppercase tracking-tight text-primary">Gita Trading</h1>
                        <p className="text-xs text-muted-foreground">Your trusted trading partner</p>
                    </div>

                    <div className="text-right space-y-1">
                        <h2 className="text-lg font-bold text-foreground uppercase">Invoice Receipt</h2>
                        <p className="text-sm font-semibold text-primary">{order.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">
                            Date: {new Date(order.created_at).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    </div>
                </div>

                {/* ADDRESS INFO GROUP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8 text-sm">
                    <div className="space-y-2">
                        <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider">Merchant</h3>
                        <div className="space-y-0.5">
                            <p className="font-semibold text-foreground">Gita Trading Store</p>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                Jl. Raya Kramat Jati No. 42<br />
                                Jakarta Timur, DKI Jakarta, 13510<br />
                                Phone: +62 21-888-888
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider">Customer Ship To</h3>
                        <div className="space-y-0.5">
                            <p className="font-semibold text-foreground">{order.customer_name}</p>
                            {order.customer_phone && <p className="text-muted-foreground text-xs">Phone: {order.customer_phone}</p>}
                            {order.customer_email && <p className="text-muted-foreground text-xs">Email: {order.customer_email}</p>}
                            <p className="text-muted-foreground text-xs mt-1 leading-relaxed whitespace-pre-line">
                                {order.shipping_address || 'No shipping address specified.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* RECEIPT ITEMS TABLE */}
                <div className="my-8">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b-2 border-slate-200 text-xs text-slate-400 uppercase tracking-wider font-semibold">
                                <th className="py-2.5 pr-4">Product / Item</th>
                                <th className="py-2.5 px-4 text-right">Price</th>
                                <th className="py-2.5 px-4 text-center">Qty</th>
                                <th className="py-2.5 pl-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {order.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="py-3.5 pr-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground text-sm">{item.product_name}</span>
                                            {item.variant_name && (
                                                <span className="text-xs text-muted-foreground mt-0.5">
                                                    Variant: {item.variant_name}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4 text-right text-foreground">
                                        Rp {Number(item.price).toLocaleString('id-ID')}
                                    </td>
                                    <td className="py-3.5 px-4 text-center text-muted-foreground">{item.qty}</td>
                                    <td className="py-3.5 pl-4 text-right font-bold text-foreground">
                                        Rp {Number(item.subtotal).toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PRICING BREAKDOWN */}
                <div className="border-t border-slate-100 pt-6 flex justify-end">
                    <div className="w-full md:w-80 space-y-3 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span className="font-semibold text-foreground">
                                Rp {Number(order.subtotal).toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Shipping Cost</span>
                            <span className="font-semibold text-foreground">
                                Rp {Number(order.shipping_cost).toLocaleString('id-ID')}
                            </span>
                        </div>
                        {Number(order.discount) > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                                <span>Discount</span>
                                <span className="font-semibold text-rose-600">
                                    - Rp {Number(order.discount).toLocaleString('id-ID')}
                                </span>
                            </div>
                        )}
                        <hr className="border-slate-100" />
                        <div className="flex justify-between items-baseline pt-1">
                            <span className="font-extrabold text-base text-foreground">Grand Total</span>
                            <span className="font-black text-lg text-primary">
                                Rp {Number(order.grand_total).toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="border-t border-slate-100 pt-8 mt-12 text-center text-xs text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-600">Thank you for your business!</p>
                    <p>If you have any questions about this receipt, please contact our customer support.</p>
                </div>
            </div>
        </div>
    );
}
