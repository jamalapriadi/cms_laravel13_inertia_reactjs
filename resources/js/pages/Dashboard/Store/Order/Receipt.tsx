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
        <div className="min-h-screen bg-card p-6 text-foreground md:p-12">
            <Head title={`Receipt - ${order.invoice_number}`} />

            {/* PRINT TOOLBAR */}
            <div className="mx-auto mb-8 flex max-w-3xl items-center justify-between gap-3 rounded-xl border bg-muted/50 p-4 print:hidden">
                <span className="text-xs font-medium text-muted-foreground">
                    Receipt print preview. This toolbar will be hidden in the
                    printout.
                </span>
                <div className="flex gap-2">
                    <Button size="sm" onClick={() => window.print()}>
                        Print
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.close()}
                    >
                        Close
                    </Button>
                </div>
            </div>

            {/* RECEIPT CONTENT BOX */}
            <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8 shadow-sm md:p-12 print:border-none print:p-0 print:shadow-none">
                {/* HEADER */}
                <div className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-8">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black tracking-tight text-primary uppercase">
                            Gita Trading
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Your trusted trading partner
                        </p>
                    </div>

                    <div className="space-y-1 text-right">
                        <h2 className="text-lg font-bold text-foreground uppercase">
                            Invoice Receipt
                        </h2>
                        <p className="text-sm font-semibold text-primary">
                            {order.invoice_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Date:{' '}
                            {new Date(order.created_at).toLocaleDateString(
                                'id-ID',
                                {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                },
                            )}
                        </p>
                    </div>
                </div>

                {/* ADDRESS INFO GROUP */}
                <div className="my-8 grid grid-cols-1 gap-8 text-sm md:grid-cols-2">
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                            Merchant
                        </h3>
                        <div className="space-y-0.5">
                            <p className="font-semibold text-foreground">
                                Gita Trading Store
                            </p>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                Jl. Raya Kramat Jati No. 42
                                <br />
                                Jakarta Timur, DKI Jakarta, 13510
                                <br />
                                Phone: +62 21-888-888
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                            Customer Ship To
                        </h3>
                        <div className="space-y-0.5">
                            <p className="font-semibold text-foreground">
                                {order.customer_name}
                            </p>
                            {order.customer_phone && (
                                <p className="text-xs text-muted-foreground">
                                    Phone: {order.customer_phone}
                                </p>
                            )}
                            {order.customer_email && (
                                <p className="text-xs text-muted-foreground">
                                    Email: {order.customer_email}
                                </p>
                            )}
                            <p className="mt-1 text-xs leading-relaxed whitespace-pre-line text-muted-foreground">
                                {order.shipping_address ||
                                    'No shipping address specified.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* RECEIPT ITEMS TABLE */}
                <div className="my-8">
                    <table className="w-full border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b-2 border-border text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                <th className="py-2.5 pr-4">Product / Item</th>
                                <th className="px-4 py-2.5 text-right">
                                    Price
                                </th>
                                <th className="px-4 py-2.5 text-center">Qty</th>
                                <th className="py-2.5 pl-4 text-right">
                                    Amount
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {order.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="py-3.5 pr-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-foreground">
                                                {item.product_name}
                                            </span>
                                            {item.variant_name && (
                                                <span className="mt-0.5 text-xs text-muted-foreground">
                                                    Variant: {item.variant_name}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-right text-foreground">
                                        Rp{' '}
                                        {Number(item.price).toLocaleString(
                                            'id-ID',
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 text-center text-muted-foreground">
                                        {item.qty}
                                    </td>
                                    <td className="py-3.5 pl-4 text-right font-bold text-foreground">
                                        Rp{' '}
                                        {Number(item.subtotal).toLocaleString(
                                            'id-ID',
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PRICING BREAKDOWN */}
                <div className="flex justify-end border-t border-border pt-6">
                    <div className="w-full space-y-3 text-sm md:w-80">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span className="font-semibold text-foreground">
                                Rp{' '}
                                {Number(order.subtotal).toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Shipping Cost</span>
                            <span className="font-semibold text-foreground">
                                Rp{' '}
                                {Number(order.shipping_cost).toLocaleString(
                                    'id-ID',
                                )}
                            </span>
                        </div>
                        {Number(order.discount) > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                                <span>Discount</span>
                                <span className="font-semibold text-rose-700 dark:text-rose-300">
                                    - Rp{' '}
                                    {Number(order.discount).toLocaleString(
                                        'id-ID',
                                    )}
                                </span>
                            </div>
                        )}
                        <hr className="border-border" />
                        <div className="flex items-baseline justify-between pt-1">
                            <span className="text-base font-extrabold text-foreground">
                                Grand Total
                            </span>
                            <span className="text-lg font-black text-primary">
                                Rp{' '}
                                {Number(order.grand_total).toLocaleString(
                                    'id-ID',
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="mt-12 space-y-1 border-t border-border pt-8 text-center text-xs text-muted-foreground">
                    <p className="font-semibold text-muted-foreground">
                        Thank you for your business!
                    </p>
                    <p>
                        If you have any questions about this receipt, please
                        contact our customer support.
                    </p>
                </div>
            </div>
        </div>
    );
}
