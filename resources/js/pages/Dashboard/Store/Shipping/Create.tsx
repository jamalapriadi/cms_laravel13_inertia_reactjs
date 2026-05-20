import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/master-data-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import { ArrowLeft, Truck } from 'lucide-react';

interface OrderOption {
    id: string;
    invoice_number: string;
    customer_name: string;
    shipping_cost: number;
    shipping_address: string | null;
}

interface Props {
    orders: OrderOption[];
}

export default function Create({ orders }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        order_id: '',
        courier: 'JNE',
        tracking_number: '',
        status: 'pending',
        shipping_cost: 0,
        shipping_address: '',
        shipped_at: '',
        delivered_at: '',
    });

    const handleOrderChange = (orderId: string) => {
        const selectedOrder = orders.find((o) => o.id === orderId);
        if (selectedOrder) {
            setData({
                ...data,
                order_id: orderId,
                shipping_cost: Number(selectedOrder.shipping_cost),
                shipping_address: selectedOrder.shipping_address || '',
            });
        } else {
            setData('order_id', orderId);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/dashboard/ecommerce/shipping');
    };

    return (
        <AppLayout>
            <Head title="Create Shipping Log" />

            <div className="container mx-auto max-w-4xl space-y-8 px-6 py-8">
                {/* HEADER */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/ecommerce/shipping">
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Shipping Log</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Register a new shipping record for an order.
                        </p>
                    </div>
                </div>

                <hr className="border-border" />

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Order Selector */}
                        <div className="space-y-2">
                            <Label htmlFor="order_id">Associated Order</Label>
                            <select
                                id="order_id"
                                value={data.order_id}
                                onChange={(e) => handleOrderChange(e.target.value)}
                                className="flex w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                required
                            >
                                <option value="">-- Select Order --</option>
                                {orders.map((o) => (
                                    <option key={o.id} value={o.id}>
                                        {o.invoice_number} | {o.customer_name} (Cost: Rp {Number(o.shipping_cost).toLocaleString('id-ID')})
                                    </option>
                                ))}
                            </select>
                            {errors.order_id && (
                                <p className="text-xs font-semibold text-red-500 mt-1">{errors.order_id}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Only orders without existing shipping records are listed.
                            </p>
                        </div>

                        {/* Courier & Tracking Number */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="courier">Courier / Carrier</Label>
                                <select
                                    id="courier"
                                    value={data.courier}
                                    onChange={(e) => setData('courier', e.target.value)}
                                    className="flex w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    required
                                >
                                    <option value="JNE">JNE Express</option>
                                    <option value="J&T">J&T Express</option>
                                    <option value="Sicepat">Sicepat</option>
                                    <option value="POS Indonesia">POS Indonesia</option>
                                    <option value="Anteraja">Anteraja</option>
                                    <option value="Tiki">TIKI</option>
                                    <option value="Wahana">Wahana</option>
                                    <option value="GoSend">GoSend</option>
                                    <option value="GrabExpress">GrabExpress</option>
                                    <option value="Other">Other / Custom</option>
                                </select>
                                {errors.courier && (
                                    <p className="text-xs font-semibold text-red-500 mt-1">{errors.courier}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tracking_number">Tracking Number (Resi)</Label>
                                <Input
                                    id="tracking_number"
                                    value={data.tracking_number}
                                    onChange={(e) => setData('tracking_number', e.target.value)}
                                    placeholder="Enter receipt/tracking number"
                                />
                                {errors.tracking_number && (
                                    <p className="text-xs font-semibold text-red-500 mt-1">{errors.tracking_number}</p>
                                )}
                            </div>
                        </div>

                        {/* Cost & Status */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="shipping_cost">Shipping Cost (Rupiah)</Label>
                                <Input
                                    id="shipping_cost"
                                    type="number"
                                    min="0"
                                    value={data.shipping_cost}
                                    onChange={(e) => setData('shipping_cost', Number(e.target.value))}
                                    required
                                />
                                {errors.shipping_cost && (
                                    <p className="text-xs font-semibold text-red-500 mt-1">{errors.shipping_cost}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Shipping Status</Label>
                                <select
                                    id="status"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="flex w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    required
                                >
                                    <option value="pending">Pending (Created)</option>
                                    <option value="processing">Processing (Packing)</option>
                                    <option value="shipped">Shipped (In Transit)</option>
                                    <option value="delivered">Delivered (Completed)</option>
                                    <option value="failed">Failed</option>
                                    <option value="returned">Returned</option>
                                </select>
                                {errors.status && (
                                    <p className="text-xs font-semibold text-red-500 mt-1">{errors.status}</p>
                                )}
                            </div>
                        </div>

                        {/* Destination Address */}
                        <div className="space-y-2">
                            <Label htmlFor="shipping_address">Shipping Address</Label>
                            <Textarea
                                id="shipping_address"
                                value={data.shipping_address}
                                onChange={(e) => setData('shipping_address', e.target.value)}
                                placeholder="Recipient physical delivery address"
                                rows={3}
                            />
                            {errors.shipping_address && (
                                <p className="text-xs font-semibold text-red-500 mt-1">{errors.shipping_address}</p>
                            )}
                        </div>

                        {/* Timestamps overrides */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="shipped_at">Shipped Date & Time (Optional)</Label>
                                <Input
                                    id="shipped_at"
                                    type="datetime-local"
                                    value={data.shipped_at}
                                    onChange={(e) => setData('shipped_at', e.target.value)}
                                />
                                {errors.shipped_at && (
                                    <p className="text-xs font-semibold text-red-500 mt-1">{errors.shipped_at}</p>
                                )}
                                <p className="text-[10px] text-muted-foreground">
                                    Leave blank to auto-generate the current time when status changes to Shipped/Delivered.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="delivered_at">Delivered Date & Time (Optional)</Label>
                                <Input
                                    id="delivered_at"
                                    type="datetime-local"
                                    value={data.delivered_at}
                                    onChange={(e) => setData('delivered_at', e.target.value)}
                                />
                                {errors.delivered_at && (
                                    <p className="text-xs font-semibold text-red-500 mt-1">{errors.delivered_at}</p>
                                )}
                                <p className="text-[10px] text-muted-foreground">
                                    Leave blank to auto-generate the current time when status changes to Delivered.
                                </p>
                            </div>
                        </div>

                        {/* Submit Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-border">
                            <Link href="/dashboard/ecommerce/shipping">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={processing} className="flex items-center gap-2">
                                <Truck className="w-4 h-4" />
                                {processing ? 'Creating...' : 'Create Shipment'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
