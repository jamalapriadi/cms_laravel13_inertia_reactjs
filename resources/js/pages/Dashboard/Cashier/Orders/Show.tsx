import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Printer, ShoppingBag, CreditCard, User, Calendar } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { RefundCancelActions } from './RefundCancelActions';

interface Props {
    order: any;
}

export default function CashierOrderShow({ order }: Props) {
    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(amount));
    };

    return (
        <>
            <Head title={`Detail Transaksi ${order.invoice_number}`} />
            
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/my-admin/dashboard/cashier/orders">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                Transaksi: {order.invoice_number}
                            </h2>
                            <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                <Badge variant={order.status === 'completed' ? 'default' : (order.status === 'cancelled' ? 'destructive' : 'secondary')}>
                                    {order.status}
                                </Badge>
                                <Badge variant={order.payment_status === 'paid' ? 'default' : (order.payment_status === 'cancelled' || order.payment_status === 'refunded' ? 'destructive' : 'secondary')}>
                                    {order.payment_status}
                                </Badge>
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <RefundCancelActions order={order} />
                        <Button asChild>
                            <a href={`/my-admin/dashboard/cashier/orders/${order.id}/receipt`} target="_blank">
                                <Printer className="mr-2 h-4 w-4" />
                                Cetak Struk
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Left Column: Order Details */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                                    Detail Item
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produk</TableHead>
                                            <TableHead className="text-right">Harga</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.items.map((item: any) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <p className="font-medium">{item.product_name}</p>
                                                    {item.variant_name && (
                                                        <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                                                    )}
                                                    {item.is_price_overridden && (
                                                        <span className="text-xs text-amber-600 font-medium block">
                                                            Manual Price: {item.price_override_reason}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {item.is_price_overridden ? (
                                                        <div className="text-right">
                                                            <p className="font-medium text-amber-700">{formatCurrency(item.price)}</p>
                                                            <p className="text-xs text-muted-foreground line-through">{formatCurrency(item.original_unit_price || 0)}</p>
                                                        </div>
                                                    ) : (
                                                        formatCurrency(item.price)
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">{item.qty}</TableCell>
                                                <TableCell className="text-right font-medium">{formatCurrency(item.subtotal)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                <div className="mt-6 space-y-2">
                                    <div className="flex justify-end gap-12 text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-end gap-12 text-sm">
                                        <span className="text-muted-foreground">Diskon</span>
                                        <span className="font-medium text-destructive">-{formatCurrency(order.discount)}</span>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-end gap-12 text-lg font-bold">
                                        <span>Total</span>
                                        <span>{formatCurrency(order.grand_total)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Customer & Payment */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                    Pelanggan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium">Nama</p>
                                    <p className="text-sm text-muted-foreground">{order.customer_name || 'Walk-in Customer'}</p>
                                </div>
                                {order.customer_phone && (
                                    <div>
                                        <p className="text-sm font-medium">No. Telepon</p>
                                        <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                                    Pembayaran
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium">Metode</p>
                                    <p className="text-sm text-muted-foreground capitalize">
                                        {order.payment_method?.replace('_', ' ') || '-'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium">Dibayar</p>
                                        <p className="text-sm text-muted-foreground">{formatCurrency(order.amount_paid)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Kembali</p>
                                        <p className="text-sm text-muted-foreground">{formatCurrency(order.change_amount)}</p>
                                    </div>
                                </div>
                                {order.payment_note && (
                                    <div>
                                        <p className="text-sm font-medium">Catatan</p>
                                        <p className="text-sm text-muted-foreground">{order.payment_note}</p>
                                    </div>
                                )}
                                <Separator className="my-2" />
                                <div>
                                    <p className="text-sm font-medium flex items-center gap-1">
                                        <Calendar className="h-4 w-4" /> Waktu Transaksi
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {new Date(order.created_at).toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Kasir</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {order.cashier?.name || 'Sistem'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

CashierOrderShow.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/my-admin/dashboard',
        },
        {
            title: 'Cashier / POS',
            href: '/my-admin/dashboard/cashier',
        },
        {
            title: 'Riwayat Transaksi',
            href: '/my-admin/dashboard/cashier/orders',
        },
        {
            title: 'Detail',
        },
    ],
};
