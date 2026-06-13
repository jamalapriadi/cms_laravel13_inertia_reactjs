import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    KeyRound,
    Power,
    ShoppingBag,
    ShoppingCart,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/master-data-layout';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    is_active: boolean;
    email_verified_at?: string | null;
    last_login_at?: string | null;
    orders_count: number;
    carts_count: number;
    paid_revenue?: number | string | null;
    created_at: string;
}

interface Order {
    id: string;
    invoice_number: string;
    grand_total: number | string;
    payment_status: string;
    status: string;
    created_at: string;
}

interface Cart {
    id: string;
    items_count: number;
    total_price: number;
    total_qty: number;
    updated_at: string;
}

interface Props {
    customer: Customer;
    recentOrders: Order[];
    recentCarts: Cart[];
    activity: {
        paid_orders: number;
        pending_orders: number;
        completed_orders: number;
        active_carts: number;
        abandoned_carts: number;
    };
}

const money = (value: number | string | null | undefined) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(Number(value ?? 0));

export default function Show({
    customer,
    recentOrders,
    recentCarts,
    activity,
}: Props) {
    const toggleLogin = () => {
        router.patch(
            `/my-admin/dashboard/ecommerce/customers/${customer.id}/toggle-login`,
            {},
            { preserveScroll: true },
        );
    };

    const resetPassword = () => {
        router.post(
            `/my-admin/dashboard/ecommerce/customers/${customer.id}/reset-password`,
            {},
            { preserveScroll: true },
        );
    };

    return (
        <AppLayout>
            <Head title={`Customer ${customer.name}`} />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/my-admin/dashboard/ecommerce/customers">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">
                                {customer.name}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {customer.email}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={toggleLogin}>
                            <Power className="h-4 w-4" />
                            {customer.is_active
                                ? 'Disable Login'
                                : 'Enable Login'}
                        </Button>
                        <Button onClick={resetPassword}>
                            <KeyRound className="h-4 w-4" />
                            Reset Password
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <SummaryCard
                        label="Orders"
                        value={String(customer.orders_count)}
                    />
                    <SummaryCard
                        label="Carts"
                        value={String(customer.carts_count)}
                    />
                    <SummaryCard
                        label="Paid Orders"
                        value={String(activity.paid_orders)}
                    />
                    <SummaryCard
                        label="Paid Revenue"
                        value={money(customer.paid_revenue)}
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
                        <h2 className="font-semibold">Profile</h2>
                        <Info label="Phone" value={customer.phone || '-'} />
                        <Info label="Address" value={customer.address || '-'} />
                        <Info
                            label="Login Status"
                            value={customer.is_active ? 'Active' : 'Disabled'}
                        />
                        <Info
                            label="Email Verified"
                            value={
                                customer.email_verified_at
                                    ? new Date(
                                          customer.email_verified_at,
                                      ).toLocaleString('id-ID')
                                    : '-'
                            }
                        />
                        <Info
                            label="Last Login"
                            value={
                                customer.last_login_at
                                    ? new Date(
                                          customer.last_login_at,
                                      ).toLocaleString('id-ID')
                                    : '-'
                            }
                        />
                    </div>

                    <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm lg:col-span-2">
                        <h2 className="flex items-center gap-2 font-semibold">
                            <ShoppingBag className="h-4 w-4 text-primary" />
                            Recent Orders
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b text-xs text-muted-foreground uppercase">
                                    <tr>
                                        <th className="py-2">Invoice</th>
                                        <th className="py-2">Total</th>
                                        <th className="py-2">Payment</th>
                                        <th className="py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {recentOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td className="py-3">
                                                <Link
                                                    href={`/my-admin/dashboard/orders/${order.id}`}
                                                    className="font-semibold text-primary hover:underline"
                                                >
                                                    {order.invoice_number}
                                                </Link>
                                            </td>
                                            <td className="py-3">
                                                {money(order.grand_total)}
                                            </td>
                                            <td className="py-3">
                                                {order.payment_status}
                                            </td>
                                            <td className="py-3">
                                                {order.status}
                                            </td>
                                        </tr>
                                    ))}
                                    {recentOrders.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="py-6 text-center text-muted-foreground"
                                            >
                                                No order activity yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
                    <h2 className="flex items-center gap-2 font-semibold">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                        Recent Cart Activity
                    </h2>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {recentCarts.map((cart) => (
                            <Link
                                key={cart.id}
                                href={`/my-admin/dashboard/ecommerce/carts/${cart.id}`}
                                className="rounded-lg border p-4 transition hover:bg-muted/50"
                            >
                                <p className="font-mono text-xs font-semibold">
                                    {cart.id}
                                </p>
                                <p className="mt-2 text-sm">
                                    {cart.total_qty} items /{' '}
                                    {money(cart.total_price)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Updated{' '}
                                    {new Date(cart.updated_at).toLocaleString(
                                        'id-ID',
                                    )}
                                </p>
                            </Link>
                        ))}
                        {recentCarts.length === 0 && (
                            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                                No cart activity yet.
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>Active carts: {activity.active_carts}</span>
                        <span>Abandoned carts: {activity.abandoned_carts}</span>
                        <span>Pending orders: {activity.pending_orders}</span>
                        <span>
                            Completed orders: {activity.completed_orders}
                        </span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {label}
            </span>
            <p className="mt-2 text-xl font-bold">{value}</p>
        </div>
    );
}

function Info({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {label}
            </span>
            <p className="mt-1 text-sm font-medium">{value || '-'}</p>
        </div>
    );
}
