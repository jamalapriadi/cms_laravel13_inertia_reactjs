import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, Calculator } from 'lucide-react';

interface Props {
    session: any;
    summary: {
        opening_cash: number;
        cash_sales: number;
        expected_cash: number;
    };
}

export default function CashierSessionsClose({ session, summary }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        closing_cash: summary.expected_cash.toString(),
        closed_note: '',
    });

    const difference = Number(data.closing_cash) - summary.expected_cash;

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(amount));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/my-admin/dashboard/cashier/sessions/${session.id}/close`);
    };

    return (
        <>
            <Head title="Tutup Shift Kasir" />
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Tutup Shift Kasir</h2>
                        <p className="text-muted-foreground">
                            Hitung dan masukkan jumlah uang kas fisik di laci saat ini.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Modal Awal</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">{formatCurrency(summary.opening_cash)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Penjualan Tunai</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">{formatCurrency(summary.cash_sales)}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-primary">Expected Cash</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-primary">{formatCurrency(summary.expected_cash)}</div>
                        </CardContent>
                    </Card>
                </div>

                <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>Informasi</AlertTitle>
                    <AlertDescription>
                        Menurut perhitungan sistem, jumlah uang fisik di laci kasir seharusnya adalah <strong>{formatCurrency(summary.expected_cash)}</strong>.
                    </AlertDescription>
                </Alert>

                <Card>
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="h-5 w-5" />
                                Hitung Uang Laci
                            </CardTitle>
                            <CardDescription>
                                Masukkan jumlah total uang tunai yang ada di laci kasir secara fisik.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="closing_cash" className="text-base">Jumlah Uang Kas Aktual (Rp)</Label>
                                <Input
                                    id="closing_cash"
                                    type="number"
                                    min="0"
                                    required
                                    className="text-lg py-6"
                                    value={data.closing_cash}
                                    onChange={(e) => setData('closing_cash', e.target.value)}
                                    placeholder="Total uang fisik di laci"
                                />
                                {errors.closing_cash && (
                                    <p className="text-sm text-destructive">{errors.closing_cash}</p>
                                )}
                            </div>
                            
                            <div className="p-4 rounded-lg bg-muted flex justify-between items-center">
                                <span className="font-medium">Selisih (Difference):</span>
                                <span className={`text-lg font-bold ${difference < 0 ? 'text-destructive' : difference > 0 ? 'text-success' : ''}`}>
                                    {formatCurrency(difference)}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="closed_note">Catatan Penutupan (Opsional)</Label>
                                <Textarea
                                    id="closed_note"
                                    value={data.closed_note}
                                    onChange={(e) => setData('closed_note', e.target.value)}
                                    placeholder={difference !== 0 ? "Jelaskan mengapa ada selisih uang..." : "Catatan saat tutup shift..."}
                                    rows={3}
                                    required={difference !== 0}
                                />
                                {errors.closed_note && (
                                    <p className="text-sm text-destructive">{errors.closed_note}</p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6">
                            <Button variant="outline" asChild>
                                <Link href={`/my-admin/dashboard/cashier/sessions/${session.id}`}>Batal</Link>
                            </Button>
                            <Button type="submit" variant="destructive" disabled={processing}>
                                Tutup Shift
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </>
    );
}

CashierSessionsClose.layout = {
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
            title: 'Tutup Shift',
            href: '#',
        },
    ],
};
