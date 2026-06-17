import { Head, Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Store, Receipt, Banknote, CreditCard, Wallet, LockKeyhole } from 'lucide-react';

interface Props {
    session: any;
    movements: any[];
    pending_movements_count: number;
}

export default function CashierSessionsShow({ session, movements, pending_movements_count }: Props) {
    const { auth } = usePage<any>().props;
    const isOwner = auth.user.id === session.cashier_id;

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(amount));
    };

    return (
        <>
            <Head title={`Detail Shift - ${session.cashier?.name}`} />
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            Detail Shift Kasir
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-muted-foreground">
                                {session.cashier?.name}
                            </span>
                            <Badge variant={session.status === 'open' ? 'default' : 'secondary'}>
                                {session.status.toUpperCase()}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href="/my-admin/dashboard/cashier/sessions">
                                Kembali
                            </Link>
                        </Button>
                        {pending_movements_count > 0 && session.status === 'open' && (
                            <div className="bg-amber-100 text-amber-800 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                                Ada {pending_movements_count} movement pending
                            </div>
                        )}
                        {session.status === 'open' && isOwner && (
                            <Button asChild variant="destructive" disabled={pending_movements_count > 0}>
                                <Link href={`/my-admin/dashboard/cashier/sessions/${session.id}/close`}>
                                    <LockKeyhole className="mr-2 h-4 w-4" />
                                    Tutup Shift
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Modal Awal
                            </CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(session.opening_cash)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Penjualan Tunai
                            </CardTitle>
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(session.cash_sales_total)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Expected Cash
                            </CardTitle>
                            <Store className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(session.expected_cash)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Modal Awal + Tunai
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Omset
                            </CardTitle>
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(session.total_sales)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Tunai & Non-Tunai
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Waktu</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Waktu Buka</span>
                                <span>{new Date(session.opened_at).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Waktu Tutup</span>
                                <span>{session.closed_at ? new Date(session.closed_at).toLocaleString('id-ID') : '-'}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Catatan Buka</span>
                                <span>{session.note || '-'}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Catatan Tutup</span>
                                <span>{session.closed_note || '-'}</span>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Rekapitulasi Uang Kas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Uang Kas di Laci (Actual)</span>
                                <span className="font-bold">{session.status === 'closed' ? formatCurrency(session.closing_cash) : 'Belum Ditutup'}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Uang Kas Sistem (Expected)</span>
                                <span>{formatCurrency(session.expected_cash)}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Selisih (Difference)</span>
                                <span className={`font-bold ${session.difference < 0 ? 'text-destructive' : session.difference > 0 ? 'text-success' : ''}`}>
                                    {session.status === 'closed' ? formatCurrency(session.difference) : '-'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Penjualan Non-Tunai</span>
                                <span>{formatCurrency(session.non_cash_sales_total)}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Total Kas Masuk (Movement)</span>
                                <span className="text-green-600">+{formatCurrency(session.cash_in_total || 0)}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Total Kas Keluar & Biaya</span>
                                <span className="text-red-600">-{formatCurrency((session.cash_out_total || 0) + (session.expense_total || 0) + (session.owner_withdrawal_total || 0))}</span>
                            </div>
                            <div className="flex justify-between pb-2">
                                <span className="text-muted-foreground">Total Diskon Diberikan</span>
                                <span className="text-destructive">{formatCurrency(session.total_discount)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Cash Movements pada Shift Ini</CardTitle>
                        <CardDescription>
                            Daftar pergerakan uang kas fisik selama shift ini.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Waktu</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Jumlah</TableHead>
                                    <TableHead>Alasan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movements?.length > 0 ? (
                                    movements.map((movement: any) => (
                                        <TableRow key={movement.id}>
                                            <TableCell>
                                                {new Date(movement.created_at).toLocaleTimeString('id-ID')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {movement.type.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={movement.direction === 'in' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                                {movement.direction === 'in' ? '+' : '-'}{formatCurrency(movement.amount)}
                                            </TableCell>
                                            <TableCell>{movement.reason}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        movement.status === 'approved' ? 'default' :
                                                        movement.status === 'pending' ? 'secondary' :
                                                        'destructive'
                                                    }
                                                >
                                                    {movement.status.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link href={`/my-admin/dashboard/cashier/cash-movements/${movement.id}`}>
                                                        Detail
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                            Tidak ada cash movement pada shift ini.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Transaksi pada Shift Ini</CardTitle>
                        <CardDescription>
                            Daftar pesanan POS yang dicatat selama shift ini.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Waktu</TableHead>
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>Pelanggan</TableHead>
                                    <TableHead>Metode Bayar</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {session.orders?.length > 0 ? (
                                    session.orders.map((order: any) => (
                                        <TableRow key={order.id}>
                                            <TableCell>
                                                {new Date(order.created_at).toLocaleTimeString('id-ID')}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {order.invoice_number}
                                            </TableCell>
                                            <TableCell>{order.customer_name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="uppercase">
                                                    {order.payment_method.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(order.grand_total)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link href={`/my-admin/dashboard/cashier/orders/${order.id}`}>
                                                        Detail
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                            Tidak ada transaksi pada shift ini.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CashierSessionsShow.layout = {
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
            title: 'Shift Kasir',
            href: '/my-admin/dashboard/cashier/sessions',
        },
        {
            title: 'Detail Shift',
            href: '#',
        },
    ],
};
