import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
    active_session: any;
    is_admin: boolean;
}

export default function CashMovementsCreate({ active_session, is_admin }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        type: '',
        amount: '',
        reason: '',
        note: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/my-admin/dashboard/cashier/cash-movements');
    };

    return (
        <>
            <Head title="Catat Cash Movement" />
            <div className="max-w-xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Catat Cash Movement</h2>
                        <p className="text-muted-foreground">
                            Catat pergerakan uang kas fisik dari/ke laci kasir.
                        </p>
                    </div>
                </div>

                {!active_session && is_admin && (
                    <div className="bg-amber-50 text-amber-900 p-4 rounded-md text-sm">
                        Perhatian: Anda tidak sedang berada dalam shift kasir aktif, tetapi Anda login sebagai admin.
                    </div>
                )}

                <Card>
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <CardTitle>Detail Movement</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Tipe Movement</Label>
                                <Select value={data.type} onValueChange={(val) => setData('type', val)} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Tipe Movement" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash_in">Kas Masuk (Tambah Modal, dsb)</SelectItem>
                                        <SelectItem value="cash_out">Kas Keluar (Tarik Uang Sementara)</SelectItem>
                                        <SelectItem value="expense">Pengeluaran Biaya (Beli Kertas Struk, Galon, dsb)</SelectItem>
                                        <SelectItem value="owner_withdrawal">Setoran/Tarik Tunai oleh Owner</SelectItem>
                                        <SelectItem value="adjustment">Penyesuaian/Koreksi Kas</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">Jumlah Nominal (Rp)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    min="1"
                                    required
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    placeholder="Contoh: 50000"
                                />
                                {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reason">Alasan / Tujuan</Label>
                                <Input
                                    id="reason"
                                    required
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    placeholder="Contoh: Beli air galon"
                                />
                                {errors.reason && <p className="text-sm text-destructive">{errors.reason}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="note">Catatan Tambahan (Opsional)</Label>
                                <Textarea
                                    id="note"
                                    value={data.note}
                                    onChange={(e) => setData('note', e.target.value)}
                                    placeholder="Penjelasan lebih detail jika diperlukan..."
                                    rows={3}
                                />
                                {errors.note && <p className="text-sm text-destructive">{errors.note}</p>}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6">
                            <Button variant="outline" asChild>
                                <Link href="/my-admin/dashboard/cashier/cash-movements">Batal</Link>
                            </Button>
                            <Button type="submit" disabled={processing || (!active_session && !is_admin)}>
                                Simpan Movement
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </>
    );
}

CashMovementsCreate.layout = {
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
            title: 'Catat Movement',
            href: '/my-admin/dashboard/cashier/cash-movements/create',
        },
    ],
};
