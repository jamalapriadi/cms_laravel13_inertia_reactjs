import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Props {
    approval: any;
}

export default function DiscountApprovalsShow({ approval }: Props) {
    const { auth } = usePage().props as any;
    const canManage = auth?.permissions?.includes('cashier.discount.manage_approvals') || auth?.user?.role === 'super-admin';
    
    const { data, setData, post, processing, errors } = useForm({
        note: '',
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleApprove = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/my-admin/dashboard/cashier/discount-approvals/${approval.id}/approve`);
    };

    const handleReject = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/my-admin/dashboard/cashier/discount-approvals/${approval.id}/reject`);
    };

    const itemsSnapshot = typeof approval.items_snapshot === 'string' ? JSON.parse(approval.items_snapshot) : approval.items_snapshot;
    
    return (
        <>
            <Head title={`Approval Detail #${approval.id}`} />
            
            <div className="flex flex-col gap-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" asChild className="-ml-4">
                        <Link href="/my-admin/dashboard/cashier/discount-approvals">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        {approval.status === 'approved' && <Badge className="bg-green-500">Approved</Badge>}
                        {approval.status === 'rejected' && <Badge variant="destructive">Rejected</Badge>}
                        {approval.status === 'pending' && <Badge variant="secondary" className="bg-amber-500 text-white">Pending</Badge>}
                        {approval.status === 'cancelled' && <Badge variant="outline">Cancelled</Badge>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="border-b">
                                <CardTitle>Detail Keranjang Belanja</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead className="text-right">Harga Normal</TableHead>
                                            <TableHead className="text-right">Harga Final (Override)</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {itemsSnapshot?.map((item: any, i: number) => (
                                            <TableRow key={i} className={item.is_price_overridden ? "bg-amber-50/50" : ""}>
                                                <TableCell>
                                                    <p className="font-medium text-sm">Produk ID: {item.product_id}</p>
                                                    {item.is_price_overridden && (
                                                        <p className="text-xs text-amber-700 mt-1 font-medium">
                                                            Alasan Override: {item.price_override_reason}
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right text-sm">
                                                    {formatCurrency(item.original_unit_price || item.unit_price || 0)}
                                                </TableCell>
                                                <TableCell className="text-right text-sm font-medium">
                                                    {item.is_price_overridden ? (
                                                        <span className="text-amber-600">{formatCurrency(item.final_unit_price)}</span>
                                                    ) : (
                                                        <span>{formatCurrency(item.final_unit_price || item.unit_price || 0)}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center text-sm">{item.qty || item.quantity}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency((item.final_unit_price || item.unit_price || 0) * (item.qty || item.quantity))}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="border-b bg-muted/20">
                                <CardTitle>Ringkasan Pengajuan</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Kasir</Label>
                                    <p className="font-medium">{approval.cashier?.name}</p>
                                </div>
                                <Separator />
                                <div>
                                    <Label className="text-xs text-muted-foreground">Alasan Kasir</Label>
                                    <p className="text-sm italic border-l-2 border-primary pl-2 mt-1 py-1">
                                        "{approval.reason}"
                                    </p>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal Normal</span>
                                        <span>{formatCurrency(approval.subtotal_before_discount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Potongan (Diskon/Harga)</span>
                                        <span className="text-amber-600 font-medium">-{formatCurrency(approval.discount_amount)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Grand Total</span>
                                        <span className="text-primary">{formatCurrency(approval.grand_total_after_discount)}</span>
                                    </div>
                                </div>
                            </CardContent>
                            
                            {approval.status === 'pending' && canManage && (
                                <CardFooter className="flex-col border-t pt-4 gap-4 bg-muted/10">
                                    <div className="w-full space-y-2">
                                        <Label>Catatan Keputusan (Opsional)</Label>
                                        <Input 
                                            placeholder="Cth: Disetujui karena promo khusus..."
                                            value={data.note}
                                            onChange={e => setData('note', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-3 w-full">
                                        <form onSubmit={handleReject} className="flex-1">
                                            <Button type="submit" variant="destructive" className="w-full" disabled={processing}>
                                                <X className="mr-2 h-4 w-4" /> Tolak
                                            </Button>
                                        </form>
                                        <form onSubmit={handleApprove} className="flex-1">
                                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={processing}>
                                                <Check className="mr-2 h-4 w-4" /> Setujui
                                            </Button>
                                        </form>
                                    </div>
                                </CardFooter>
                            )}

                            {approval.status !== 'pending' && (
                                <CardFooter className="flex-col items-start border-t pt-4">
                                    <Label className="text-xs text-muted-foreground mb-1">Ditinjau Oleh</Label>
                                    <p className="font-medium text-sm">{approval.approved_by?.name || 'Sistem'}</p>
                                    {approval.approval_note && (
                                        <div className="mt-3 w-full bg-muted/50 p-3 rounded text-sm">
                                            <Label className="text-xs text-muted-foreground block mb-1">Catatan Keputusan</Label>
                                            {approval.approval_note}
                                        </div>
                                    )}
                                </CardFooter>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

DiscountApprovalsShow.layout = {
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
        {
            title: 'Detail',
            href: '#',
        },
    ],
};
