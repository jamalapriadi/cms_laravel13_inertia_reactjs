import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Store, Receipt, Banknote, ShoppingCart, Calendar, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Props {
    filters: any;
    summary: any;
    paymentBreakdown: any[];
    cashierBreakdown: any[];
    sessionBreakdown: any[];
    productBreakdown: any[];
    refundBreakdown: any;
    cashMovementBreakdown: any;
    discountBreakdown: any;
    priceOverrideBreakdown: any;
    orders: any;
    cashiers: any[];
}

export default function DailyClosingReport({ 
    filters, summary, paymentBreakdown, cashierBreakdown, sessionBreakdown, 
    productBreakdown, refundBreakdown, cashMovementBreakdown, discountBreakdown, 
    priceOverrideBreakdown, orders, cashiers 
}: Props) {
    const { auth } = usePage().props as any;
    const canViewAll = auth?.user?.permissions?.includes('cashier.reports.daily.view_all');

    const [filterState, setFilterState] = useState({
        date: filters.date || '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
        cashier_id: filters.cashier_id || '',
        payment_method: filters.payment_method || '',
    });

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(amount));
    };

    const applyFilters = () => {
        router.get('/my-admin/dashboard/cashier/reports/daily', filterState, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        const defaultFilters = { date: new Date().toISOString().split('T')[0], start_date: '', end_date: '', cashier_id: '', payment_method: '' };
        setFilterState(defaultFilters);
        router.get('/my-admin/dashboard/cashier/reports/daily', defaultFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = () => {
        const query = new URLSearchParams(filterState as any).toString();
        window.location.href = `/my-admin/dashboard/cashier/reports/daily/export?${query}`;
    };

    return (
        <>
            <Head title="Daily Closing Report" />
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            Daily Closing Report
                        </h2>
                        <p className="text-muted-foreground">
                            Ringkasan operasional dan transaksi POS harian
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                        <Button asChild>
                            <a href={`/my-admin/dashboard/cashier/reports/daily/print?${new URLSearchParams(filterState as any).toString()}`} target="_blank">
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                            </a>
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Filter Laporan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end">
                            <div className="space-y-2">
                                <Label>Tanggal (Single)</Label>
                                <Input 
                                    type="date" 
                                    value={filterState.date} 
                                    onChange={e => setFilterState({...filterState, date: e.target.value, start_date: '', end_date: ''})} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Mulai Tanggal</Label>
                                <Input 
                                    type="date" 
                                    value={filterState.start_date} 
                                    onChange={e => setFilterState({...filterState, start_date: e.target.value, date: ''})} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Sampai Tanggal</Label>
                                <Input 
                                    type="date" 
                                    value={filterState.end_date} 
                                    onChange={e => setFilterState({...filterState, end_date: e.target.value, date: ''})} 
                                />
                            </div>
                            {canViewAll && (
                                <div className="space-y-2">
                                    <Label>Kasir</Label>
                                    <Select 
                                        value={filterState.cashier_id} 
                                        onValueChange={val => setFilterState({...filterState, cashier_id: val === 'all' ? '' : val})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Semua Kasir" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Kasir</SelectItem>
                                            {cashiers.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Metode Pembayaran</Label>
                                <Select 
                                    value={filterState.payment_method} 
                                    onValueChange={val => setFilterState({...filterState, payment_method: val === 'all' ? '' : val})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Metode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Metode</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="transfer">Transfer</SelectItem>
                                        <SelectItem value="qris">QRIS</SelectItem>
                                        <SelectItem value="debit">Debit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={applyFilters} className="w-full">Filter</Button>
                                <Button onClick={clearFilters} variant="outline" className="w-full">Reset</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Gross Sales</CardTitle>
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.gross_sales)}</div>
                            <p className="text-xs text-muted-foreground">Total Transaksi POS</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net Sales</CardTitle>
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">{formatCurrency(summary.net_sales)}</div>
                            <p className="text-xs text-muted-foreground">Setelah dikurangi refund</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total_orders}</div>
                            <p className="text-xs text-muted-foreground">Transaksi Valid</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Cash Difference</CardTitle>
                            <Store className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${summary.total_cash_difference < 0 ? 'text-destructive' : ''}`}>
                                {formatCurrency(summary.total_cash_difference)}
                            </div>
                            <p className="text-xs text-muted-foreground">Selisih Kas dari Shift yang ditutup</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Metode</TableHead>
                                        <TableHead>Orders</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paymentBreakdown.length > 0 ? paymentBreakdown.map((row, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium capitalize">{row.method}</TableCell>
                                            <TableCell>{row.total_orders}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(row.total_amount)} ({row.percentage}%)</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Tidak ada data</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Refund & Discount</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span>Total Refund</span>
                                <span className="font-bold text-destructive">{formatCurrency(refundBreakdown.total_refund_amount)} ({refundBreakdown.total_refund_count}x)</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span>Total Diskon</span>
                                <span className="font-bold">{formatCurrency(discountBreakdown.total_discount_amount)}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span>Total Price Override</span>
                                <span className="font-bold">{formatCurrency(priceOverrideBreakdown.total_override_amount)} ({priceOverrideBreakdown.total_items_with_override} item)</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {canViewAll && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Cashier Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kasir</TableHead>
                                        <TableHead>Orders</TableHead>
                                        <TableHead>Gross Sales</TableHead>
                                        <TableHead>Net Sales</TableHead>
                                        <TableHead>Cash</TableHead>
                                        <TableHead>Non-Cash</TableHead>
                                        <TableHead className="text-right">Selisih Kas</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cashierBreakdown.length > 0 ? cashierBreakdown.map((row, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{row.cashier_name}</TableCell>
                                            <TableCell>{row.total_orders}</TableCell>
                                            <TableCell>{formatCurrency(row.gross_sales)}</TableCell>
                                            <TableCell className="text-primary">{formatCurrency(row.net_sales)}</TableCell>
                                            <TableCell>{formatCurrency(row.cash_sales)}</TableCell>
                                            <TableCell>{formatCurrency(row.non_cash_sales)}</TableCell>
                                            <TableCell className={`text-right ${row.total_cash_difference < 0 ? 'text-destructive' : ''}`}>{formatCurrency(row.total_cash_difference)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Tidak ada data</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Transaksi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>Waktu</TableHead>
                                    <TableHead>Kasir</TableHead>
                                    <TableHead>Metode</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.data.length > 0 ? orders.data.map((order: any) => (
                                    <TableRow key={order.id}>
                                        <TableCell>
                                            <Link href={`/my-admin/dashboard/cashier/orders/${order.id}`} className="text-primary hover:underline">
                                                {order.invoice_number}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{new Date(order.created_at).toLocaleString('id-ID')}</TableCell>
                                        <TableCell>{order.cashier?.name}</TableCell>
                                        <TableCell className="capitalize">{order.payment_method}</TableCell>
                                        <TableCell>
                                            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{formatCurrency(order.grand_total)}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Belum ada transaksi</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                        {orders.data.length > 0 && orders.links && orders.links.length > 3 && (
                            <div className="flex flex-wrap items-center justify-center gap-1 mt-4">
                                {orders.links.map((link: any, index: number) => (
                                    <Button
                                        key={index}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => {
                                            if (link.url) {
                                                router.get(link.url, filterState as any, {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                });
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

DailyClosingReport.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/my-admin/dashboard' },
        { title: 'Cashier / POS', href: '/my-admin/dashboard/cashier' },
        { title: 'Daily Closing Report', href: '/my-admin/dashboard/cashier/reports/daily' },
    ],
};
