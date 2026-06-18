import { Head, Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Search, Filter } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router } from '@inertiajs/react';

interface Props {
    approvals: any;
    filters: any;
}

export default function DiscountApprovalsIndex({ approvals, filters }: Props) {
    const [status, setStatus] = useState(filters.status || '');
    
    const handleFilter = () => {
        router.get('/my-admin/dashboard/cashier/discount-approvals', {
            status,
        }, { preserveState: true });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge className="bg-green-500">Approved</Badge>;
            case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
            case 'pending': return <Badge variant="secondary" className="bg-amber-500 text-white hover:bg-amber-600">Pending</Badge>;
            case 'cancelled': return <Badge variant="outline">Cancelled</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <>
            <Head title="Discount Approvals" />
            
            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader className="border-b pb-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <CardTitle>Daftar Pengajuan Diskon & Harga</CardTitle>
                        <div className="flex items-center gap-2">
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Semua Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleFilter}>Terapkan</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Waktu</TableHead>
                                        <TableHead>Kasir</TableHead>
                                        <TableHead>Tipe Pengajuan</TableHead>
                                        <TableHead>Subtotal</TableHead>
                                        <TableHead>Diskon/Potongan</TableHead>
                                        <TableHead>Grand Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-16"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {approvals.data.length > 0 ? approvals.data.map((approval: any) => (
                                        <TableRow key={approval.id}>
                                            <TableCell className="text-sm">
                                                {new Date(approval.created_at).toLocaleString('id-ID')}
                                            </TableCell>
                                            <TableCell className="text-sm font-medium">
                                                {approval.cashier?.name}
                                            </TableCell>
                                            <TableCell>
                                                <span className="capitalize">{approval.approval_type.replace('_', ' ')}</span>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {formatCurrency(approval.subtotal_before_discount)}
                                            </TableCell>
                                            <TableCell className="text-sm font-semibold text-amber-600">
                                                {formatCurrency(approval.discount_amount)}
                                                {approval.discount_type === 'percentage' && ` (${approval.discount_value}%)`}
                                            </TableCell>
                                            <TableCell className="text-sm font-bold">
                                                {formatCurrency(approval.grand_total_after_discount)}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(approval.status)}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/my-admin/dashboard/cashier/discount-approvals/${approval.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                Tidak ada data.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        
                        {/* Pagination placeholder - assume your standard pagination component is used or implement simple one */}
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => approvals.prev_page_url && router.get(approvals.prev_page_url)}
                                disabled={!approvals.prev_page_url}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => approvals.next_page_url && router.get(approvals.next_page_url)}
                                disabled={!approvals.next_page_url}
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

DiscountApprovalsIndex.layout = {
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
            title: 'Discount Approvals',
            href: '/my-admin/dashboard/cashier/discount-approvals',
        },
    ],
};
