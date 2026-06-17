import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Search, Eye, ReceiptText } from 'lucide-react';
import { useState } from 'react';

interface Props {
    orders: any; // Using any for pagination object simplify for now
    filters: {
        search?: string;
        status?: string;
        payment_status?: string;
        date_range?: string;
    };
}

export default function CashierOrdersIndex({ orders, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(amount));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/my-admin/dashboard/cashier/orders',
            { search },
            { preserveState: true }
        );
    };

    return (
        <>
            <Head title="Riwayat Transaksi Kasir" />
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            Riwayat Transaksi
                        </h2>
                        <p className="text-muted-foreground">
                            Daftar transaksi dari kasir/POS
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-sm">
                            <Input
                                placeholder="Cari invoice / pelanggan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Button type="submit" variant="secondary">
                                <Search className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Pelanggan</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status Pembayaran</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.data.length > 0 ? (
                                    orders.data.map((order: any) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">
                                                {order.invoice_number}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(order.created_at).toLocaleString('id-ID')}
                                            </TableCell>
                                            <TableCell>{order.customer_name}</TableCell>
                                            <TableCell>
                                                {formatCurrency(order.grand_total)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        order.payment_status === 'paid'
                                                            ? 'default'
                                                            : (order.payment_status === 'cancelled' || order.payment_status === 'refunded' ? 'destructive' : 'secondary')
                                                    }
                                                >
                                                    {order.payment_status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    asChild
                                                >
                                                    <Link href={`/my-admin/dashboard/cashier/orders/${order.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    asChild
                                                >
                                                    <a href={`/my-admin/dashboard/cashier/orders/${order.id}/receipt`} target="_blank">
                                                        <ReceiptText className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                            Tidak ada transaksi ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        
                        {/* Pagination simple implementation */}
                        {orders.links && orders.links.length > 3 && (
                            <div className="mt-4 flex items-center justify-center gap-1">
                                {orders.links.map((link: any, idx: number) => (
                                    <Button
                                        key={idx}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => {
                                            if (link.url) {
                                                router.get(link.url);
                                            }
                                        }}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CashierOrdersIndex.layout = {
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
    ],
};
