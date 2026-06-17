import { Head, Link, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ShoppingCart, Trash2, Plus, Minus, UserCircle, Clock, ListOrdered } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface PaymentMethod {
    code: string;
    name: string;
}

interface Props {
    payment_methods: PaymentMethod[];
    active_session: any;
    pending_transaction?: any;
}

interface ProductResult {
    id: string;
    type: string;
    product_id: string;
    variant_item_id: string | null;
    name: string;
    variant_label: string | null;
    sku: string;
    price: number;
    stock: number;
    thumbnail: string | null;
    brand: string | null;
    category: string | null;
}

interface CartItem extends ProductResult {
    qty: number;
}

export default function CashierCreate({ payment_methods, active_session, pending_transaction }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ProductResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // Initialize cart from pending_transaction if exists
    const initialCart = pending_transaction ? pending_transaction.items.map((item: any) => ({
        id: item.stock_unit_id ? `su-${item.stock_unit_id}` : (item.variant_item_id ? `var-${item.variant_item_id}` : `prod-${item.product_id}`),
        type: item.stock_unit_id ? 'stock_unit' : (item.variant_item_id ? 'variant_item' : 'simple_product'),
        product_id: item.product_id,
        variant_item_id: item.variant_item_id,
        stock_unit_id: item.stock_unit_id,
        name: item.name,
        variant_label: item.variant_label,
        sku: item.sku || '',
        price: Number(item.unit_price),
        stock: item.meta?.stock || 999, // Allow if stock isn't fully tracked here
        thumbnail: item.meta?.thumbnail || null,
        brand: null,
        category: null,
        qty: item.quantity,
    })) : [];

    const [cart, setCart] = useState<CartItem[]>(initialCart);

    const { data, setData, post, processing, errors } = useForm({
        items: [] as any[],
        customer_name: pending_transaction?.customer?.name || '',
        customer_phone: pending_transaction?.customer?.phone || '',
        discount: pending_transaction ? Number(pending_transaction.discount_amount) : 0,
        payment_method: 'cash',
        amount_paid: 0,
        change_amount: 0,
        payment_note: '',
        pending_transaction_id: pending_transaction?.id || null,
    });

    const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
    const [holdCartName, setHoldCartName] = useState('');
    const [isHolding, setIsHolding] = useState(false);

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(amount));
    };

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const grandTotal = Math.max(0, subtotal - data.discount);
    
    useEffect(() => {
        const change = Math.max(0, data.amount_paid - grandTotal);
        setData('change_amount', change);
    }, [data.amount_paid, grandTotal]);

    useEffect(() => {
        setData('items', cart.map(item => ({
            product_id: item.product_id,
            variant_item_id: item.variant_item_id,
            stock_unit_id: item.stock_unit_id || null,
            qty: item.qty
        })));
    }, [cart]);

    const [barcodeInput, setBarcodeInput] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.length < 2) return;
        
        setIsSearching(true);
        try {
            const res = await axios.get('/my-admin/dashboard/cashier/products/search', {
                params: { q: searchQuery }
            });
            setSearchResults(res.data.data);
            if (res.data.data.length === 0) {
                toast.info('Produk tidak ditemukan atau stok kosong');
            }
        } catch (error) {
            toast.error('Gagal mencari produk');
        } finally {
            setIsSearching(false);
        }
    };

    const handleBarcodeScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcodeInput.trim()) return;

        try {
            const res = await axios.get('/my-admin/dashboard/cashier/barcode/scan', {
                params: { code: barcodeInput.trim() }
            });
            
            if (res.data.success) {
                const product = res.data.data;
                addToCart(product);
            } else {
                toast.error(res.data.message || 'Item tidak ditemukan.');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Terjadi kesalahan saat memproses barcode.');
        } finally {
            setBarcodeInput('');
        }
    };

    const addToCart = (product: ProductResult & { stock_unit_id?: string | null }) => {
        setCart(prev => {
            if (product.type === 'stock_unit' && product.stock_unit_id) {
                const existing = prev.find(item => item.stock_unit_id === product.stock_unit_id);
                if (existing) {
                    toast.error('Stock unit (IMEI/Serial) ini sudah ada di keranjang.');
                    return prev;
                }
                toast.success(`${product.name} ditambahkan`);
                return [...prev, { ...product, qty: 1 }];
            }

            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.qty >= product.stock) {
                    toast.error(`Stok tidak mencukupi. Sisa stok: ${product.stock}`);
                    return prev;
                }
                toast.success(`${product.name} qty ditambah`);
                return prev.map(item => 
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item
                );
            }
            toast.success(`${product.name} ditambahkan`);
            return [...prev, { ...product, qty: 1 }];
        });
        
        setSearchResults([]);
        setSearchQuery('');
    };

    const updateQty = (id: string, newQty: number) => {
        if (newQty < 1) return;
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                if (item.type === 'stock_unit') {
                    toast.error('Item dengan serial/IMEI unik tidak bisa diubah quantity-nya.');
                    return item;
                }
                if (newQty > item.stock) {
                    toast.error(`Maksimal stok: ${item.stock}`);
                    return item;
                }
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) {
            toast.error('Keranjang masih kosong');
            return;
        }
        if (data.amount_paid < grandTotal && data.payment_method === 'cash') {
            toast.error('Jumlah uang dibayar kurang dari total pembayaran');
            return;
        }

        post('/my-admin/dashboard/cashier/orders');
    };

    const handleHoldCart = (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) {
            toast.error('Keranjang masih kosong');
            return;
        }

        setIsHolding(true);
        router.post('/my-admin/dashboard/cashier/pending-transactions', {
            name: holdCartName,
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            discount: data.discount,
            note: data.payment_note,
            items: cart.map(item => ({
                product_id: item.product_id,
                variant_item_id: item.variant_item_id,
                stock_unit_id: item.stock_unit_id || null,
                qty: item.qty
            }))
        }, {
            onSuccess: () => {
                setIsHoldModalOpen(false);
                setHoldCartName('');
                // cart will be cleared on redirect
            },
            onFinish: () => setIsHolding(false)
        });
    };

    return (
        <>
            <Head title="Point of Sale" />
            
            <div className="flex flex-col gap-6">
                {!active_session && (
                    <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive flex flex-col items-center justify-center py-10">
                        <h3 className="font-bold text-xl mb-2">Akses Ditolak: Belum Ada Shift Aktif</h3>
                        <p className="mb-6">Anda harus membuka shift kasir terlebih dahulu sebelum bisa memproses transaksi.</p>
                        <Button asChild variant="destructive" size="lg">
                            <Link href="/my-admin/dashboard/cashier/sessions/open">Buka Shift Kasir</Link>
                        </Button>
                    </div>
                )}

                {active_session && (
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left Side: Product Search & Cart */}
                    <div className="flex-1 space-y-4">
                        <Card>
                            <CardHeader className="pb-3 border-b mb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Search className="h-5 w-5" />
                                    Scan Barcode / SKU / IMEI
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <form onSubmit={handleBarcodeScan} className="flex gap-2">
                                    <Input 
                                        placeholder="Scan barcode, SKU, serial number, atau IMEI..." 
                                        value={barcodeInput}
                                        onChange={(e) => setBarcodeInput(e.target.value)}
                                        autoFocus
                                    />
                                    <Button type="submit">
                                        Add
                                    </Button>
                                </form>

                                <Separator />

                                <div className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                                    <Search className="h-4 w-4" /> Cari Produk Manual
                                </div>
                                <form onSubmit={handleSearch} className="flex gap-2">
                                    <Input 
                                        placeholder="Ketik nama produk atau SKU (min. 2 huruf)..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <Button type="submit" variant="secondary" disabled={isSearching}>
                                        {isSearching ? 'Mencari...' : 'Cari'}
                                    </Button>
                                </form>

                                {searchResults.length > 0 && (
                                    <div className="mt-4 border rounded-md divide-y max-h-60 overflow-y-auto">
                                        {searchResults.map(result => (
                                            <div key={result.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    {result.thumbnail && (
                                                        <img src={`/storage/${result.thumbnail}`} alt={result.name} className="w-10 h-10 object-cover rounded" />
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-sm">{result.name} {result.variant_label ? `- ${result.variant_label}` : ''}</p>
                                                        <p className="text-xs text-muted-foreground">SKU: {result.sku} | Stok: {result.stock}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-semibold text-sm">{formatCurrency(result.price)}</span>
                                                    <Button size="sm" onClick={() => addToCart(result)}>
                                                        Pilih
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="flex-1 flex flex-col">
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5" />
                                    Keranjang
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setIsHoldModalOpen(true)} disabled={cart.length === 0}>
                                        <Clock className="h-4 w-4 mr-1" /> Hold Cart
                                    </Button>
                                    <Button variant="secondary" size="sm" asChild>
                                        <Link href="/my-admin/dashboard/cashier/pending-transactions">
                                            <ListOrdered className="h-4 w-4 mr-1" /> Pending
                                        </Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead className="w-32 text-center">Qty</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                            <TableHead className="w-12"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cart.length > 0 ? cart.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <p className="font-medium text-sm">{item.name}</p>
                                                    {item.variant_label && <p className="text-xs text-muted-foreground">{item.variant_label}</p>}
                                                    <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.id, item.qty - 1)}>
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.id, item.qty + 1)}>
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(item.price * item.qty)}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeFromCart(item.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                    Keranjang masih kosong
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side: Checkout Form */}
                    <div className="w-full md:w-[380px] shrink-0">
                        <form onSubmit={handleSubmit}>
                            <Card className="sticky top-6">
                                <CardHeader className="bg-primary/5 pb-4 border-b">
                                    <CardTitle className="text-xl">Pembayaran</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                            <UserCircle className="h-4 w-4" />
                                            <span className="text-sm font-medium">Data Pelanggan</span>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Nama Pelanggan (Opsional)</Label>
                                            <Input 
                                                placeholder="Walk-in Customer" 
                                                value={data.customer_name}
                                                onChange={e => setData('customer_name', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>No HP (Opsional)</Label>
                                            <Input 
                                                placeholder="08xxxxxxxxxx" 
                                                value={data.customer_phone}
                                                onChange={e => setData('customer_phone', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    <Separator />

                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span className="font-medium">{formatCurrency(subtotal)}</span>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label>Diskon (Rp)</Label>
                                            <Input 
                                                type="number" 
                                                min="0"
                                                value={data.discount || ''}
                                                onChange={e => setData('discount', Number(e.target.value))}
                                                placeholder="0"
                                            />
                                        </div>

                                        <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                            <span>Total</span>
                                            <span className="text-primary">{formatCurrency(grandTotal)}</span>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label>Metode Pembayaran</Label>
                                            <Select value={data.payment_method} onValueChange={(v) => setData('payment_method', v)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih Metode" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {payment_methods.map(method => (
                                                        <SelectItem key={method.code} value={method.code}>{method.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.payment_method && <span className="text-xs text-destructive">{errors.payment_method}</span>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Jumlah Dibayar (Rp)</Label>
                                            <Input 
                                                type="number" 
                                                min="0"
                                                value={data.amount_paid || ''}
                                                onChange={e => setData('amount_paid', Number(e.target.value))}
                                                placeholder="0"
                                                required
                                            />
                                        </div>

                                        <div className="flex justify-between text-sm font-medium pt-2">
                                            <span className={data.change_amount > 0 ? "text-green-600" : "text-muted-foreground"}>Kembalian</span>
                                            <span className={data.change_amount > 0 ? "text-green-600" : "text-muted-foreground"}>{formatCurrency(data.change_amount)}</span>
                                        </div>

                                        <div className="space-y-2 pt-2">
                                            <Label>Catatan (Opsional)</Label>
                                            <Input 
                                                placeholder="Catatan pembayaran..." 
                                                value={data.payment_note}
                                                onChange={e => setData('payment_note', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    {(errors as any).error && (
                                        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                                            {(errors as any).error}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button 
                                        type="submit" 
                                        className="w-full" 
                                        size="lg" 
                                        disabled={processing || cart.length === 0}
                                    >
                                        {processing ? 'Memproses...' : 'Selesaikan Transaksi'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </div>
                </div>
                )}
            </div>

            <Dialog open={isHoldModalOpen} onOpenChange={setIsHoldModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hold Cart (Simpan Transaksi)</DialogTitle>
                        <DialogDescription>
                            Simpan keranjang ini sementara untuk diproses nanti. Stok tidak akan dikurangi.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nama / Referensi Cart</Label>
                            <Input 
                                placeholder="Cth: Meja 2, Pelanggan A, dll..." 
                                value={holdCartName}
                                onChange={(e) => setHoldCartName(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsHoldModalOpen(false)} disabled={isHolding}>
                            Batal
                        </Button>
                        <Button onClick={handleHoldCart} disabled={isHolding}>
                            {isHolding ? 'Menyimpan...' : 'Simpan Cart'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

CashierCreate.layout = {
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
            title: 'Transaksi Baru',
            href: '/my-admin/dashboard/cashier/orders/create',
        },
    ],
};
