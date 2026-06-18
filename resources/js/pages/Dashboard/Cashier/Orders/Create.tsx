import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ShoppingCart, Trash2, Plus, Minus, UserCircle, Clock, ListOrdered, Edit2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
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
    final_unit_price: number;
    is_price_overridden: boolean;
    price_override_reason: string | null;
}

export default function CashierCreate({ payment_methods, active_session, pending_transaction }: Props) {
    const { auth } = usePage().props as any;
    const canOverridePrice = auth?.permissions?.includes('cashier.price_override') || auth?.user?.role === 'super-admin' || true; // Fallback to let backend reject if needed

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
        price: Number(item.original_unit_price || item.unit_price),
        stock: item.meta?.stock || 999, // Allow if stock isn't fully tracked here
        thumbnail: item.meta?.thumbnail || null,
        brand: null,
        category: null,
        qty: item.quantity,
        final_unit_price: Number(item.final_unit_price || item.unit_price),
        is_price_overridden: !!item.is_price_overridden,
        price_override_reason: item.price_override_reason || null,
    })) : [];

    const [cart, setCart] = useState<CartItem[]>(initialCart);

    const { data, setData, post, processing, errors } = useForm({
        items: [] as any[],
        customer_name: pending_transaction?.customer?.name || '',
        customer_phone: pending_transaction?.customer?.phone || '',
        discount_type: 'nominal',
        discount_value: pending_transaction ? Number(pending_transaction.discount_amount) : 0,
        discount_approval_id: null as string | null,
        payment_method: 'cash',
        amount_paid: 0,
        change_amount: 0,
        payment_note: '',
        pending_transaction_id: pending_transaction?.id || null,
    });

    // Pricing Preview State
    const [pricingResult, setPricingResult] = useState<any>({
        subtotal: 0,
        discount_amount: 0,
        grand_total: 0,
        requires_approval: false,
        approval_reason: null,
        price_override_total: 0
    });
    const [isPreviewing, setIsPreviewing] = useState(false);

    // Approval State
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [approvalNote, setApprovalNote] = useState('');
    const [isRequestingApproval, setIsRequestingApproval] = useState(false);
    const [currentApproval, setCurrentApproval] = useState<any>(null);

    // Price Override Modal State
    const [editingItem, setEditingItem] = useState<CartItem | null>(null);
    const [overridePrice, setOverridePrice] = useState<number>(0);
    const [overrideReason, setOverrideReason] = useState<string>('');

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(amount));
    };

    // Calculate change
    useEffect(() => {
        const change = Math.max(0, data.amount_paid - pricingResult.grand_total);
        setData('change_amount', change);
    }, [data.amount_paid, pricingResult.grand_total]);

    // Update items in form data
    useEffect(() => {
        setData('items', cart.map(item => ({
            product_id: item.product_id,
            variant_item_id: item.variant_item_id,
            stock_unit_id: item.stock_unit_id || null,
            qty: item.qty,
            final_unit_price: item.final_unit_price,
            is_price_overridden: item.is_price_overridden,
            price_override_reason: item.price_override_reason,
        })));
    }, [cart]);

    // Debounced Pricing Preview with Optimistic Update
    useEffect(() => {
        // Optimistic UI calculation for instant feedback
        let localSubtotal = 0;
        let localOverrideTotal = 0;
        
        cart.forEach(item => {
            localSubtotal += item.final_unit_price * item.qty;
            if (item.is_price_overridden) {
                localOverrideTotal += (item.final_unit_price - item.price) * item.qty;
            }
        });

        let localDiscountAmount = 0;
        const discValue = Number(data.discount_value) || 0;
        if (data.discount_type === 'nominal') {
            localDiscountAmount = discValue;
        } else if (data.discount_type === 'percentage') {
            localDiscountAmount = localSubtotal * (discValue / 100);
        }
        
        if (localDiscountAmount > localSubtotal) localDiscountAmount = localSubtotal;
        
        setPricingResult(prev => ({
            ...prev,
            subtotal: localSubtotal,
            discount_amount: localDiscountAmount,
            grand_total: Math.max(0, localSubtotal - localDiscountAmount),
            price_override_total: localOverrideTotal
        }));

        // Debounce backend request for approval rules validation
        const timer = setTimeout(() => {
            if (cart.length > 0) {
                previewPricing();
            } else {
                setPricingResult({
                    subtotal: 0,
                    discount_amount: 0,
                    grand_total: 0,
                    requires_approval: false,
                    approval_reason: null,
                    price_override_total: 0
                });
            }
        }, 300); // Reduced from 500ms for slightly snappier backend update
        return () => clearTimeout(timer);
    }, [cart, data.discount_type, data.discount_value]);

    const previewPricing = async () => {
        setIsPreviewing(true);
        try {
            const payload = {
                items: cart.map(item => ({
                    product_id: item.product_id,
                    variant_item_id: item.variant_item_id,
                    stock_unit_id: item.stock_unit_id,
                    qty: item.qty,
                    final_unit_price: item.final_unit_price,
                    is_price_overridden: item.is_price_overridden,
                    price_override_reason: item.price_override_reason,
                })),
                discount_type: data.discount_type,
                discount_value: data.discount_value || 0,
            };
            
            const res = await axios.post('/my-admin/dashboard/cashier/pricing/preview', payload);
            setPricingResult(res.data.data);
            
            // If it no longer requires approval, but we had an approval, clear it
            if (!res.data.data.requires_approval && data.discount_approval_id) {
                setData('discount_approval_id', null);
                setCurrentApproval(null);
            }
        } catch (error: any) {
            console.error('Failed to preview pricing', error);
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            }
        } finally {
            setIsPreviewing(false);
        }
    };

    const requestApproval = async () => {
        setIsRequestingApproval(true);
        try {
            const payload = {
                items: cart.map(item => ({
                    product_id: item.product_id,
                    variant_item_id: item.variant_item_id,
                    stock_unit_id: item.stock_unit_id,
                    qty: item.qty,
                    final_unit_price: item.final_unit_price,
                    is_price_overridden: item.is_price_overridden,
                    price_override_reason: item.price_override_reason,
                })),
                discount_type: data.discount_type,
                discount_value: data.discount_value || 0,
                request_note: approvalNote,
                subtotal: pricingResult.subtotal,
                discount_amount: pricingResult.discount_amount,
                grand_total: pricingResult.grand_total,
            };
            
            const res = await axios.post('/my-admin/dashboard/cashier/discount-approvals', payload);
            setCurrentApproval(res.data.data);
            setData('discount_approval_id', res.data.data.id);
            setIsApprovalModalOpen(false);
            setApprovalNote('');
            toast.success('Permintaan approval berhasil dikirim. Menunggu persetujuan.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal mengirim permintaan approval.');
        } finally {
            setIsRequestingApproval(false);
        }
    };

    const checkApprovalStatus = async () => {
        if (!currentApproval?.id) return;
        try {
            const res = await axios.get(`/my-admin/dashboard/cashier/discount-approvals/${currentApproval.id}`);
            setCurrentApproval(res.data.data);
            if (res.data.data.status === 'approved') {
                toast.success('Approval telah disetujui!');
            } else if (res.data.data.status === 'rejected') {
                toast.error('Approval ditolak. Silakan ubah diskon/harga.');
                setData('discount_approval_id', null);
            } else {
                toast.info('Status masih pending.');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const saveOverridePrice = () => {
        if (!editingItem) return;
        if (overridePrice < 0) {
            toast.error('Harga tidak valid.');
            return;
        }
        if (!overrideReason.trim()) {
            toast.error('Alasan perubahan harga wajib diisi.');
            return;
        }

        setCart(prev => prev.map(item => {
            if (item.id === editingItem.id) {
                return {
                    ...item,
                    final_unit_price: overridePrice,
                    is_price_overridden: overridePrice !== item.price,
                    price_override_reason: overrideReason,
                };
            }
            return item;
        }));
        setEditingItem(null);
    };

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
                return [...prev, { 
                    ...product, 
                    qty: 1, 
                    final_unit_price: product.price,
                    is_price_overridden: false,
                    price_override_reason: null
                }];
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
            return [...prev, { 
                ...product, 
                qty: 1,
                final_unit_price: product.price,
                is_price_overridden: false,
                price_override_reason: null
            }];
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
        if (data.amount_paid < pricingResult.grand_total && data.payment_method === 'cash') {
            toast.error('Jumlah uang dibayar kurang dari total pembayaran');
            return;
        }
        if (pricingResult.requires_approval) {
            if (!currentApproval || currentApproval.status !== 'approved') {
                toast.error('Transaksi membutuhkan approval diskon yang disetujui.');
                return;
            }
        }

        post('/my-admin/dashboard/cashier/orders');
    };

    const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
    const [holdCartName, setHoldCartName] = useState('');
    const [isHolding, setIsHolding] = useState(false);

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
            discount: pricingResult.discount_amount,
            note: data.payment_note,
            items: cart.map(item => ({
                product_id: item.product_id,
                variant_item_id: item.variant_item_id,
                stock_unit_id: item.stock_unit_id || null,
                qty: item.qty,
                final_unit_price: item.final_unit_price,
                is_price_overridden: item.is_price_overridden,
                price_override_reason: item.price_override_reason
            }))
        }, {
            onSuccess: () => {
                setIsHoldModalOpen(false);
                setHoldCartName('');
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
                <div className="flex flex-col xl:flex-row gap-6">
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
                                    {isPreviewing && <span className="text-xs text-muted-foreground animate-pulse ml-2">(Menghitung...)</span>}
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
                            <CardContent className="flex-1 p-0 overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-1/3">Item</TableHead>
                                            <TableHead>Harga</TableHead>
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
                                                    {item.is_price_overridden && (
                                                        <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-200 text-[10px] rounded font-medium">
                                                            Manual Price
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 group">
                                                        <div>
                                                            {item.is_price_overridden ? (
                                                                <>
                                                                    <p className="text-sm font-semibold">{formatCurrency(item.final_unit_price)}</p>
                                                                    <p className="text-[10px] text-muted-foreground line-through">{formatCurrency(item.price)}</p>
                                                                </>
                                                            ) : (
                                                                <p className="text-sm">{formatCurrency(item.price)}</p>
                                                            )}
                                                        </div>
                                                        {canOverridePrice && (
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => {
                                                                    setEditingItem(item);
                                                                    setOverridePrice(item.final_unit_price);
                                                                    setOverrideReason(item.price_override_reason || '');
                                                                }}
                                                            >
                                                                <Edit2 className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                    </div>
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
                                                    {formatCurrency(item.final_unit_price * item.qty)}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeFromCart(item.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                    <div className="w-full xl:w-[420px] shrink-0">
                        <form onSubmit={handleSubmit}>
                            <Card className="sticky top-6 shadow-lg border-muted">
                                <CardHeader className="bg-muted/30 pb-4 border-b">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <ShoppingCart className="h-5 w-5 text-primary" />
                                        Ringkasan & Pembayaran
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    {pricingResult.requires_approval && (
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                                <div className="space-y-1 w-full">
                                                    <p className="text-sm font-medium text-amber-900">Membutuhkan Approval</p>
                                                    <p className="text-xs text-amber-700">{pricingResult.approval_reason}</p>
                                                    
                                                    {currentApproval ? (
                                                        <div className="mt-3 bg-white p-2 rounded border border-amber-100 flex items-center justify-between">
                                                            <div>
                                                                <span className="text-[10px] font-bold uppercase text-muted-foreground">Status</span>
                                                                <div className="flex items-center gap-1">
                                                                    {currentApproval.status === 'approved' && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                                                                    {currentApproval.status === 'pending' && <Clock className="h-3 w-3 text-amber-600" />}
                                                                    <span className={`text-xs font-semibold ${
                                                                        currentApproval.status === 'approved' ? 'text-green-600' :
                                                                        currentApproval.status === 'rejected' ? 'text-destructive' : 'text-amber-600'
                                                                    }`}>
                                                                        {currentApproval.status.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={checkApprovalStatus}>
                                                                Refresh
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button type="button" size="sm" className="w-full mt-3 bg-amber-600 hover:bg-amber-700" onClick={() => setIsApprovalModalOpen(true)}>
                                                            Request Approval Supervisor
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-muted/50">
                                        <div className="flex items-center gap-2 text-primary font-medium mb-1">
                                            <UserCircle className="h-4 w-4" />
                                            <span className="text-sm">Data Pelanggan</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <Label className="text-xs text-muted-foreground mb-1 block">Nama Pelanggan (Opsional)</Label>
                                                <Input 
                                                    className="bg-white"
                                                    placeholder="Walk-in Customer" 
                                                    value={data.customer_name}
                                                    onChange={e => setData('customer_name', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground mb-1 block">No HP (Opsional)</Label>
                                                <Input 
                                                    className="bg-white"
                                                    placeholder="08xxxxxxxxxx" 
                                                    value={data.customer_phone}
                                                    onChange={e => setData('customer_phone', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between text-sm items-center">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span className="font-semibold">{formatCurrency(pricingResult.subtotal)}</span>
                                        </div>
                                        
                                        <div className="space-y-2 bg-muted/10 p-3 rounded-lg border border-dashed border-muted">
                                            <Label className="text-xs text-muted-foreground block mb-1">Diskon Order</Label>
                                            <div className="flex gap-2">
                                                <Select value={data.discount_type} onValueChange={(v) => setData('discount_type', v)}>
                                                    <SelectTrigger className="w-[100px] bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="nominal">Rp</SelectItem>
                                                        <SelectItem value="percentage">%</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Input 
                                                    type="number" 
                                                    min="0"
                                                    className="flex-1 bg-white"
                                                    value={data.discount_value || ''}
                                                    onChange={e => setData('discount_value', Number(e.target.value))}
                                                    placeholder="0"
                                                />
                                            </div>
                                            {pricingResult.discount_amount > 0 && (
                                                <p className="text-xs text-right text-emerald-600 font-medium mt-1">
                                                    Potongan: -{formatCurrency(pricingResult.discount_amount)}
                                                </p>
                                            )}
                                        </div>

                                        {pricingResult.price_override_total < 0 && (
                                            <div className="flex justify-between text-sm items-center text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                                                <span>Koreksi Harga (Total)</span>
                                                <span className="font-medium">{formatCurrency(pricingResult.price_override_total)}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center text-xl font-bold pt-4 border-t">
                                            <span>Total</span>
                                            <span className="text-primary tracking-tight">{formatCurrency(pricingResult.grand_total)}</span>
                                        </div>
                                    </div>

                                    <Separator className="my-2" />

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Metode Pembayaran</Label>
                                            <Select value={data.payment_method} onValueChange={(v) => setData('payment_method', v)}>
                                                <SelectTrigger className="h-11">
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

                                        <div className="space-y-2 bg-primary/5 p-3 rounded-xl border border-primary/10">
                                            <Label className="text-xs text-primary font-medium">Jumlah Dibayar (Rp)</Label>
                                            <Input 
                                                type="number" 
                                                min="0"
                                                className="h-12 text-lg font-semibold bg-white border-primary/20"
                                                value={data.amount_paid || ''}
                                                onChange={e => setData('amount_paid', Number(e.target.value))}
                                                placeholder="0"
                                                required
                                            />
                                            
                                            <div className="flex justify-between items-center text-sm font-medium pt-2">
                                                <span className={data.change_amount > 0 ? "text-emerald-600" : "text-muted-foreground"}>Kembalian</span>
                                                <span className={data.change_amount > 0 ? "text-emerald-600 font-bold text-lg" : "text-muted-foreground"}>
                                                    {formatCurrency(data.change_amount)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-1">
                                            <Label className="text-xs text-muted-foreground">Catatan (Opsional)</Label>
                                            <Input 
                                                placeholder="Catatan pembayaran..." 
                                                value={data.payment_note}
                                                onChange={e => setData('payment_note', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    {(errors as any).error && (
                                        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            {(errors as any).error}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button 
                                        type="submit" 
                                        className="w-full" 
                                        size="lg" 
                                        disabled={
                                            processing || 
                                            cart.length === 0 || 
                                            (pricingResult.requires_approval && currentApproval?.status !== 'approved')
                                        }
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

            {/* Hold Cart Dialog */}
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

            {/* Request Approval Dialog */}
            <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Approval Diskon/Harga</DialogTitle>
                        <DialogDescription>
                            Diskon atau perubahan harga melebihi batas. Silakan minta persetujuan Supervisor/Admin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-muted/50 rounded-md text-sm border space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Alasan Blokir:</span>
                                <span className="font-medium text-right text-amber-700">{pricingResult.approval_reason}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Catatan Permintaan (Wajib)</Label>
                            <Input 
                                placeholder="Cth: Diskon promo akhir tahun disetujui Pak Budi..." 
                                value={approvalNote}
                                onChange={(e) => setApprovalNote(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApprovalModalOpen(false)} disabled={isRequestingApproval}>
                            Batal
                        </Button>
                        <Button onClick={requestApproval} disabled={isRequestingApproval || !approvalNote.trim()}>
                            {isRequestingApproval ? 'Mengirim...' : 'Kirim Request'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Price Modal */}
            <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ubah Harga Item</DialogTitle>
                        <DialogDescription>
                            Masukkan harga baru untuk {editingItem?.name} {editingItem?.variant_label ? `(${editingItem?.variant_label})` : ''}
                        </DialogDescription>
                    </DialogHeader>
                    {editingItem && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Harga Original</Label>
                                <Input disabled value={formatCurrency(editingItem.price)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Harga Baru (Final)</Label>
                                <Input 
                                    type="number"
                                    min="0"
                                    value={overridePrice}
                                    onChange={(e) => setOverridePrice(Number(e.target.value))}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Alasan Perubahan Harga (Wajib)</Label>
                                <Input 
                                    placeholder="Cth: Harga nego, kondisi barang cacat..." 
                                    value={overrideReason}
                                    onChange={(e) => setOverrideReason(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingItem(null)}>
                            Batal
                        </Button>
                        <Button onClick={saveOverridePrice} disabled={!overrideReason.trim()}>
                            Simpan Perubahan
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
