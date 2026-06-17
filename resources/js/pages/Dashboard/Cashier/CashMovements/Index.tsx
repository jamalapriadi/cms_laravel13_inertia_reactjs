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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, PlusCircle, ArrowUpRight, ArrowDownRight, Wallet, Search } from "lucide-react";
import { useState } from 'react';

interface Props {
    movements: any;
    filters: {
        search?: string;
        status?: string;
        type?: string;
        direction?: string;
        date_range?: string;
    };
    is_admin: boolean;
}

export default function CashMovementsIndex({ movements, filters, is_admin }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [type, setType] = useState(filters.type || 'all');

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(amount));
    };

    const handleFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        const params: any = {};
        if (search) params.search = search;
        if (status && status !== 'all') params.status = status;
        if (type && type !== 'all') params.type = type;

        router.get(
            '/my-admin/dashboard/cashier/cash-movements',
            params,
            { preserveState: true, replace: true }
        );
    };

    return (
        <>
            <Head title="Cash Movements" />
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            Cash Movements
                        </h2>
                        <p className="text-muted-foreground">
                            Histori pergerakan uang kas di laci kasir
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild>
                            <Link href="/my-admin/dashboard/cashier/cash-movements/create">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Catat Movement
                            </Link>
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-2">
                            <Input
                                placeholder="Cari alasan/catatan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="sm:max-w-[250px]"
                            />
                            <Select value={type} onValueChange={(val) => { setType(val); setTimeout(handleFilter, 100); }}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Semua Tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Tipe</SelectItem>
                                    <SelectItem value="cash_in">Kas Masuk</SelectItem>
                                    <SelectItem value="cash_out">Kas Keluar</SelectItem>
                                    <SelectItem value="expense">Pengeluaran (Biaya)</SelectItem>
                                    <SelectItem value="owner_withdrawal">Penarikan Owner</SelectItem>
                                    <SelectItem value="adjustment">Penyesuaian (Koreksi)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={status} onValueChange={(val) => { setStatus(val); setTimeout(handleFilter, 100); }}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="pending">Menunggu Approval</SelectItem>
                                    <SelectItem value="approved">Disetujui</SelectItem>
                                    <SelectItem value="rejected">Ditolak</SelectItem>
                                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button type="submit" variant="secondary">
                                <Search className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Waktu</TableHead>
                                    {is_admin && <TableHead>Kasir</TableHead>}
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Jumlah</TableHead>
                                    <TableHead>Alasan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movements.data.length > 0 ? (
                                    movements.data.map((movement: any) => (
                                        <TableRow key={movement.id}>
                                            <TableCell>
                                                {new Date(movement.created_at).toLocaleString('id-ID')}
                                            </TableCell>
                                            {is_admin && (
                                                <TableCell className="font-medium">
                                                    {movement.cashier?.name}
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {movement.type.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={movement.direction === 'in' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                                {movement.direction === 'in' ? '+' : '-'}{formatCurrency(movement.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <span className="line-clamp-2 max-w-xs" title={movement.reason}>{movement.reason}</span>
                                            </TableCell>
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
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/my-admin/dashboard/cashier/cash-movements/${movement.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={is_admin ? 7 : 6} className="text-center py-6 text-muted-foreground">
                                            Tidak ada cash movement ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        
                        {/* Pagination */}
                        {movements.links && movements.links.length > 3 && (
                            <div className="mt-4 flex items-center justify-center gap-1">
                                {movements.links.map((link: any, idx: number) => (
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

CashMovementsIndex.layout = {
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
            title: 'Cash Movements',
            href: '/my-admin/dashboard/cashier/cash-movements',
        },
    ],
};
