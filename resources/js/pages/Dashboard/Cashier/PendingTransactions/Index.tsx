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
import { Search, Eye, Play, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
    pendingTransactions: any; // Using any for pagination object
    filters: {
        search?: string;
        status?: string;
    };
}

export default function PendingTransactionsIndex({ pendingTransactions, filters }: Props) {
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
            '/my-admin/dashboard/cashier/pending-transactions',
            { search },
            { preserveState: true }
        );
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

    const handleResume = (id: number) => {
        if (confirm('Lanjutkan transaksi ini? Cart saat ini di POS akan ditimpa.')) {
            router.post(`/my-admin/dashboard/cashier/pending-transactions/${id}/resume`);
        }
    };

    const handleCancel = (id: number) => {
        if (confirm('Batal transaksi pending ini?')) {
            router.post(`/my-admin/dashboard/cashier/pending-transactions/${id}/cancel`);
        }
    };

    return (
        <>
            <Head title="Pending Transactions (Hold Cart)" />
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            Pending Transactions
                        </h2>
                        <p className="text-muted-foreground">
                            Daftar transaksi kasir yang ditahan sementara
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-sm">
                            <Input
                                placeholder="Cari nama / pelanggan..."
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
                                    <TableHead>Nama Cart / Transaksi</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Pelanggan</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingTransactions.data.length > 0 ? (
                                    pendingTransactions.data.map((tx: any) => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="font-medium">
                                                {tx.name || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(tx.created_at).toLocaleString('id-ID')}
                                            </TableCell>
                                            <TableCell>{tx.customer?.name || '-'}</TableCell>
                                            <TableCell>
                                                {formatCurrency(tx.grand_total)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(tx.status)}>
                                                    {tx.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/my-admin/dashboard/cashier/pending-transactions/${tx.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                
                                                {tx.status === 'pending' && (
                                                    <>
                                                        <Button variant="outline" size="icon" onClick={() => handleResume(tx.id)} title="Resume">
                                                            <Play className="h-4 w-4 text-green-500" />
                                                        </Button>
                                                        <Button variant="outline" size="icon" onClick={() => handleCancel(tx.id)} title="Cancel">
                                                            <XCircle className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Tidak ada transaksi pending ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination links here if needed */}
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(pendingTransactions.prev_page_url)}
                                disabled={!pendingTransactions.prev_page_url}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(pendingTransactions.next_page_url)}
                                disabled={!pendingTransactions.next_page_url}
                            >
                                Next
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
