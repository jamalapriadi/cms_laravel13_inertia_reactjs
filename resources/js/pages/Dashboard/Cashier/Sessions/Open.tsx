import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from "@/components/ui/textarea";

export default function CashierSessionsOpen() {
    const { data, setData, post, processing, errors } = useForm({
        opening_cash: '',
        note: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/my-admin/dashboard/cashier/sessions');
    };

    return (
        <>
            <Head title="Buka Shift Kasir" />
            <div className="max-w-xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Buka Shift Baru</h2>
                        <p className="text-muted-foreground">
                            Masukkan modal awal kas sebelum memulai transaksi.
                        </p>
                    </div>
                </div>

                <Card>
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <CardTitle>Modal Awal (Cash in Drawer)</CardTitle>
                            <CardDescription>
                                Jumlah uang tunai fisik yang ada di laci kasir saat shift dimulai.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="opening_cash">Jumlah Uang Kas (Rp)</Label>
                                <Input
                                    id="opening_cash"
                                    type="number"
                                    min="0"
                                    required
                                    value={data.opening_cash}
                                    onChange={(e) => setData('opening_cash', e.target.value)}
                                    placeholder="Contoh: 500000"
                                />
                                {errors.opening_cash && (
                                    <p className="text-sm text-destructive">{errors.opening_cash}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="note">Catatan (Opsional)</Label>
                                <Textarea
                                    id="note"
                                    value={data.note}
                                    onChange={(e) => setData('note', e.target.value)}
                                    placeholder="Catatan tambahan saat buka shift..."
                                    rows={3}
                                />
                                {errors.note && (
                                    <p className="text-sm text-destructive">{errors.note}</p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" asChild>
                                <Link href="/my-admin/dashboard/cashier">Batal</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Buka Shift
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </>
    );
}

CashierSessionsOpen.layout = {
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
            title: 'Buka Shift',
            href: '/my-admin/dashboard/cashier/sessions/open',
        },
    ],
};
