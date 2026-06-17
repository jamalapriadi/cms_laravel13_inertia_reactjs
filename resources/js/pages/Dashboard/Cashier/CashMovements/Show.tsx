import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import { useState } from 'react';
import { CheckCircle, XCircle, Ban } from 'lucide-react';

interface Props {
    movement: any;
    can_approve: boolean;
    can_reject: boolean;
    can_cancel: boolean;
}

export default function CashMovementsShow({ movement, can_approve, can_reject, can_cancel }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        note: '',
    });

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(amount));
    };

    const handleAction = (type: 'approve' | 'reject' | 'cancel') => {
        let url = `/my-admin/dashboard/cashier/cash-movements/${movement.id}/${type}`;

        post(url, {
            onSuccess: () => {
                setData('note', '');
            }
        });
    };

    return (
        <>
            <Head title={`Detail Movement #${movement.id}`} />
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Detail Cash Movement</h2>
                        <p className="text-muted-foreground">
                            ID: #{movement.id}
                        </p>
                    </div>
                    <div>
                        <Badge
                            className="text-sm px-3 py-1"
                            variant={
                                movement.status === 'approved' ? 'default' :
                                movement.status === 'pending' ? 'secondary' :
                                'destructive'
                            }
                        >
                            {movement.status.toUpperCase()}
                        </Badge>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Movement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Tipe</p>
                                <p className="font-semibold">{movement.type.replace('_', ' ').toUpperCase()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Arah</p>
                                <p className={`font-semibold ${movement.direction === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                    {movement.direction === 'in' ? 'KAS MASUK (+)' : 'KAS KELUAR (-)'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Jumlah</p>
                                <p className="font-semibold text-lg">{formatCurrency(movement.amount)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Waktu Pembuatan</p>
                                <p>{new Date(movement.created_at).toLocaleString('id-ID')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Dibuat Oleh</p>
                                <p>{movement.created_by?.name || 'Sistem'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Shift Kasir ID</p>
                                <p>#{movement.cashier_session_id}</p>
                            </div>
                        </div>

                        <div className="mt-4">
                            <p className="text-sm text-muted-foreground font-medium">Alasan / Tujuan</p>
                            <p className="bg-muted p-3 rounded-md mt-1">{movement.reason}</p>
                        </div>

                        {movement.note && (
                            <div className="mt-4">
                                <p className="text-sm text-muted-foreground font-medium">Catatan Tambahan</p>
                                <p className="bg-muted p-3 rounded-md mt-1 whitespace-pre-wrap">{movement.note}</p>
                            </div>
                        )}

                        {movement.status !== 'pending' && movement.status !== 'cancelled' && (
                            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        {movement.status === 'approved' ? 'Di-approve Oleh' : 'Di-reject Oleh'}
                                    </p>
                                    <p>{movement.approved_by?.name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Waktu Keputusan</p>
                                    <p>
                                        {movement.approved_at && new Date(movement.approved_at).toLocaleString('id-ID')}
                                        {movement.rejected_at && new Date(movement.rejected_at).toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Actions Panel */}
                {movement.status === 'pending' && (can_approve || can_reject || can_cancel) && (
                    <Card className="border-amber-200 bg-amber-50/50">
                        <CardHeader>
                            <CardTitle className="text-amber-800">Tindakan Diperlukan</CardTitle>
                            <CardDescription className="text-amber-700">
                                Cash movement ini memerlukan persetujuan sebelum dapat dihitung dalam laporan kas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="action_note">Catatan Keputusan (Opsional)</Label>
                                    <Textarea
                                        id="action_note"
                                        placeholder="Berikan alasan mengapa Anda menyetujui, menolak, atau membatalkan movement ini..."
                                        value={data.note}
                                        onChange={(e) => setData('note', e.target.value)}
                                        className="bg-white"
                                    />
                                    {errors.note && <p className="text-sm text-destructive">{errors.note}</p>}
                                </div>
                                
                                <div className="flex gap-2 flex-wrap">
                                    {can_approve && (
                                        <Button
                                            type="button"
                                            onClick={(e) => handleAction(e, 'approve')}
                                            disabled={processing}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Setujui
                                        </Button>
                                    )}
                                    {can_reject && (
                                        <Button
                                            type="button"
                                            onClick={(e) => handleAction(e, 'reject')}
                                            disabled={processing}
                                            variant="destructive"
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Tolak
                                        </Button>
                                    )}
                                    {can_cancel && (
                                        <Button
                                            type="button"
                                            onClick={(e) => handleAction(e, 'cancel')}
                                            disabled={processing}
                                            variant="outline"
                                        >
                                            <Ban className="mr-2 h-4 w-4" />
                                            Batalkan
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Cancel Approved Action */}
                {movement.status === 'approved' && can_cancel && (
                    <Card className="border-red-200">
                        <CardHeader>
                            <CardTitle className="text-red-800">Batalkan Movement</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cancel_note">Alasan Pembatalan</Label>
                                    <Textarea
                                        id="cancel_note"
                                        required
                                        placeholder="Berikan alasan pembatalan..."
                                        value={data.note}
                                        onChange={(e) => setData('note', e.target.value)}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    onClick={(e) => {
                                        if (confirm('Yakin ingin membatalkan movement yang sudah disetujui ini? Laporan kas akan terupdate.')) {
                                            handleAction(e, 'cancel');
                                        }
                                    }}
                                    disabled={processing || !data.note}
                                    variant="destructive"
                                >
                                    <Ban className="mr-2 h-4 w-4" />
                                    Batalkan Movement
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-end">
                    <Button variant="outline" asChild>
                        <Link href="/my-admin/dashboard/cashier/cash-movements">Kembali ke Daftar</Link>
                    </Button>
                </div>
            </div>
        </>
    );
}

CashMovementsShow.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/my-admin/dashboard',
        },
        {
            title: 'Cashier',
            href: '/my-admin/dashboard/cashier',
        },
        {
            title: 'Cash Movements',
            href: '/my-admin/dashboard/cashier/cash-movements',
        },
        {
            title: 'Detail Movement',
        },
    ],
};
