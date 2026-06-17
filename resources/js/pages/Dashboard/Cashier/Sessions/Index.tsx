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
import { Search, Eye, PlusCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
    sessions: any;
    active_session: any;
    is_admin: boolean;
    filters: {
        search?: string;
        status?: string;
        date_range?: string;
    };
}

export default function CashierSessionsIndex({ sessions, active_session, is_admin, filters }: Props) {
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
            '/my-admin/dashboard/cashier/sessions',
            { search },
            { preserveState: true }
        );
    };

    return (
        <>
            <Head title="Shift Kasir / Sessions" />
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            Shift Kasir
                        </h2>
                        <p className="text-muted-foreground">
                            Daftar histori shift dan sesi kasir
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {active_session ? (
                            <Button asChild>
                                <Link href={`/my-admin/dashboard/cashier/sessions/${active_session.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Lihat Shift Aktif
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild>
                                <Link href="/my-admin/dashboard/cashier/sessions/open">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Buka Shift Baru
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-sm">
                            <Input
                                placeholder="Cari kasir..."
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
                                    <TableHead>Kasir</TableHead>
                                    <TableHead>Waktu Buka</TableHead>
                                    <TableHead>Waktu Tutup</TableHead>
                                    <TableHead>Modal Awal</TableHead>
                                    <TableHead>Total Sales</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sessions.data.length > 0 ? (
                                    sessions.data.map((session: any) => (
                                        <TableRow key={session.id}>
                                            <TableCell className="font-medium">
                                                {session.cashier?.name}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(session.opened_at).toLocaleString('id-ID')}
                                            </TableCell>
                                            <TableCell>
                                                {session.closed_at ? new Date(session.closed_at).toLocaleString('id-ID') : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(session.opening_cash)}
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(session.total_sales)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        session.status === 'open'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {session.status.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    asChild
                                                >
                                                    <Link href={`/my-admin/dashboard/cashier/sessions/${session.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                                            Tidak ada shift kasir ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        
                        {/* Pagination */}
                        {sessions.links && sessions.links.length > 3 && (
                            <div className="mt-4 flex items-center justify-center gap-1">
                                {sessions.links.map((link: any, idx: number) => (
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

CashierSessionsIndex.layout = {
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
    ],
};
