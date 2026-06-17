import { Head, Link } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Store, Receipt, Banknote, ShoppingCart, PlusCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    summary: {
        today_orders: number;
        today_revenue: number;
        month_orders: number;
        month_revenue: number;
    };
    recent_orders: Array<{
        id: string;
        invoice_number: string;
        customer_name: string;
        grand_total: string;
        created_at: string;
        payment_status: string;
    }>;
    active_session?: any;
    session_summary?: any;
}

export default function CashierIndex({ summary, recent_orders, active_session, session_summary }: Props) {
    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(amount));
    };

    return (
        <>
            <Head title="Cashier Dashboard" />
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            Cashier / POS
                        </h2>
                        <p className="text-muted-foreground">
                            Point of Sale Dashboard
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href="/my-admin/dashboard/cashier/orders">
                                <History className="mr-2 h-4 w-4" />
                                Riwayat
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href="/my-admin/dashboard/cashier/orders/create">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Transaksi Baru
                            </Link>
                        </Button>
                    </div>
                </div>

                {!active_session ? (
                    <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-lg">Belum Ada Shift Aktif</h3>
                            <p className="text-sm">Buka shift kasir terlebih dahulu untuk mulai menerima transaksi pembayaran.</p>
                        </div>
                        <Button asChild variant="destructive">
                            <Link href="/my-admin/dashboard/cashier/sessions/open">Buka Shift</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-lg text-primary flex items-center gap-2">
                                Shift Aktif <span className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded-full">Buka: {new Date(active_session.opened_at).toLocaleTimeString('id-ID')}</span>
                            </h3>
                            <div className="text-sm text-muted-foreground mt-1 flex gap-4">
                                <span>Modal: <strong>{formatCurrency(session_summary?.opening_cash || 0)}</strong></span>
                                <span>Tunai: <strong>{formatCurrency(session_summary?.cash_sales || 0)}</strong></span>
                                <span>Non-Tunai: <strong>{formatCurrency(session_summary?.non_cash_sales || 0)}</strong></span>
                            </div>
                        </div>
                        <Button asChild variant="outline" className="border-primary text-primary">
                            <Link href={`/my-admin/dashboard/cashier/sessions/${active_session.id}`}>Detail Shift</Link>
                        </Button>
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Omset Hari Ini
                            </CardTitle>
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(summary.today_revenue)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total pendapatan dari POS hari ini
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Transaksi Hari Ini
                            </CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {summary.today_orders}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Jumlah pesanan POS hari ini
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Omset Bulan Ini
                            </CardTitle>
                            <Store className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(summary.month_revenue)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total pendapatan dari POS bulan ini
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Transaksi Bulan Ini
                            </CardTitle>
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {summary.month_orders}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Jumlah pesanan POS bulan ini
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4 lg:col-span-7">
                        <CardHeader>
                            <CardTitle>Transaksi Terakhir</CardTitle>
                            <CardDescription>
                                5 Transaksi POS terakhir.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recent_orders.length > 0 ? (
                                <div className="space-y-4">
                                    {recent_orders.map((order) => (
                                        <div
                                            key={order.id}
                                            className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                                        >
                                            <div className="space-y-1">
                                                <Link href={`/my-admin/dashboard/cashier/orders/${order.id}`} className="font-medium hover:underline text-primary">
                                                    {order.invoice_number}
                                                </Link>
                                                <p className="text-sm text-muted-foreground">
                                                    {order.customer_name}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">
                                                    {formatCurrency(order.grand_total)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(order.created_at).toLocaleTimeString('id-ID')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center text-muted-foreground">
                                    Belum ada transaksi
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

CashierIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/my-admin/dashboard',
        },
        {
            title: 'Cashier / POS',
            href: '/my-admin/dashboard/cashier',
        },
    ],
};
