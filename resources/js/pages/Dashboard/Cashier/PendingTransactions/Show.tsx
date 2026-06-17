import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';

interface Props {
    pendingTransaction: any;
}

export default function PendingTransactionsShow({ pendingTransaction }: Props) {
    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(amount));
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'converted': return 'success';
            case 'cancelled': return 'destructive';
            case 'expired': return 'secondary';
            default: return 'outline';
        }
    };

    return (
        <>
            <Head title={`Detail Pending Transaction #${pendingTransaction.id}`} />
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/my-admin/dashboard/cashier/pending-transactions">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            Detail Pending Transaction
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-muted-foreground">
                                {pendingTransaction.name || `Transaction #${pendingTransaction.id}`}
                            </p>
                            <Badge variant={getStatusBadgeVariant(pendingTransaction.status)}>
                                {pendingTransaction.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Transaksi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Tanggal</p>
                                    <p>{new Date(pendingTransaction.created_at).toLocaleString('id-ID')}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Kasir</p>
                                    <p>{pendingTransaction.cashier?.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Pelanggan</p>
                                    <p>{pendingTransaction.customer?.name || 'Walk-in'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Sesi Kasir ID</p>
                                    <p>{pendingTransaction.cashier_session_id}</p>
                                </div>
                            </div>
                            {pendingTransaction.converted_order_id && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-sm font-medium text-muted-foreground">Telah Diconvert Menjadi Order</p>
                                    <Button variant="link" className="p-0 h-auto" asChild>
                                        <Link href={`/my-admin/dashboard/cashier/orders/${pendingTransaction.converted_order_id}`}>
                                            Lihat Order <ExternalLink className="ml-1 h-3 w-3" />
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Ringkasan Pembayaran</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatCurrency(pendingTransaction.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-red-500">
                                <span>Diskon</span>
                                <span>-{formatCurrency(pendingTransaction.discount_amount)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-4 border-t">
                                <span>Grand Total</span>
                                <span>{formatCurrency(pendingTransaction.grand_total)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Item Transaksi</CardTitle>
                        <CardDescription>
                            Daftar produk yang disimpan sementara
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produk</TableHead>
                                    <TableHead>Harga Satuan</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingTransaction.items.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium">{item.name}</div>
                                            {item.variant_label && (
                                                <div className="text-sm text-muted-foreground">
                                                    {item.variant_label}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(item.subtotal)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
