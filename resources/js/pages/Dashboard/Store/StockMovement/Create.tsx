import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/master-data-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import { ArrowLeft, Warehouse, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface VariantOption {
    id: string;
    name: string;
    sku: string;
    stock: number;
}

interface Props {
    variants: VariantOption[];
}

export default function Create({ variants }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        product_variant_id: '',
        type: 'purchase',
        qty: 1,
        adjustment_action: 'add',
        note: '',
    });

    const selectedVariant = variants.find((v) => v.id === data.product_variant_id);
    const currentStock = selectedVariant ? selectedVariant.stock : 0;

    let stockChange = 0;
    const qtyVal = Number(data.qty) || 0;

    if (data.type === 'purchase' || data.type === 'return' || data.type === 'cancel') {
        stockChange = qtyVal;
    } else if (data.type === 'sale') {
        stockChange = -qtyVal;
    } else if (data.type === 'adjustment') {
        stockChange = data.adjustment_action === 'subtract' ? -qtyVal : qtyVal;
    }

    const projectedStock = currentStock + stockChange;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/dashboard/ecommerce/stock-movements');
    };

    return (
        <AppLayout>
            <Head title="Add Stock Movement" />

            <div className="container mx-auto max-w-4xl space-y-8 px-6 py-8">
                {/* HEADER */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/ecommerce/stock-movements">
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Add Stock Movement</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Log a new inventory transaction and adjust stock levels.
                        </p>
                    </div>
                </div>

                <hr className="border-border" />

                <div className="grid gap-6 md:grid-cols-3">
                    {/* FORM CONTAINER */}
                    <div className="md:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Variant Selector */}
                            <div className="space-y-2">
                                <Label htmlFor="product_variant_id">Product Variant</Label>
                                <select
                                    id="product_variant_id"
                                    value={data.product_variant_id}
                                    onChange={(e) => setData('product_variant_id', e.target.value)}
                                    className="flex w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    required
                                >
                                    <option value="">-- Select Product Variant --</option>
                                    {variants.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.sku} | {v.name} (Current stock: {v.stock})
                                        </option>
                                    ))}
                                </select>
                                {errors.product_variant_id && (
                                    <p className="text-xs font-semibold text-red-500 mt-1">{errors.product_variant_id}</p>
                                )}
                            </div>

                            {/* Grid fields for type & qty */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Movement Type</Label>
                                    <select
                                        id="type"
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value)}
                                        className="flex w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        required
                                    >
                                        <option value="purchase">Purchase (Inward)</option>
                                        <option value="sale">Sale (Outward)</option>
                                        <option value="adjustment">Stock Adjustment</option>
                                        <option value="return">Return (Inward)</option>
                                        <option value="cancel">Cancel (Inward)</option>
                                    </select>
                                    {errors.type && (
                                        <p className="text-xs font-semibold text-red-500 mt-1">{errors.type}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="qty">Quantity</Label>
                                    <Input
                                        id="qty"
                                        type="number"
                                        min="1"
                                        value={data.qty}
                                        onChange={(e) => setData('qty', parseInt(e.target.value) || 0)}
                                        required
                                    />
                                    {errors.qty && (
                                        <p className="text-xs font-semibold text-red-500 mt-1">{errors.qty}</p>
                                    )}
                                </div>
                            </div>

                            {/* Adjustment action if type = adjustment */}
                            {data.type === 'adjustment' && (
                                <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/30 p-4">
                                    <Label htmlFor="adjustment_action" className="text-amber-800 font-bold">Adjustment Action</Label>
                                    <select
                                        id="adjustment_action"
                                        value={data.adjustment_action}
                                        onChange={(e) => setData('adjustment_action', e.target.value)}
                                        className="flex w-full h-10 rounded-md border border-amber-300 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                    >
                                        <option value="add">Add Stock (+)</option>
                                        <option value="subtract">Deduct Stock (-)</option>
                                    </select>
                                    <p className="text-xs text-amber-600 mt-1">
                                        Choose whether this adjustment increases or decreases the stock levels.
                                    </p>
                                </div>
                            )}

                            {/* Note */}
                            <div className="space-y-2">
                                <Label htmlFor="note">Notes / Explanation</Label>
                                <Textarea
                                    id="note"
                                    placeholder="Enter reasoning or order number for reference..."
                                    value={data.note}
                                    onChange={(e) => setData('note', e.target.value)}
                                    rows={3}
                                />
                                {errors.note && (
                                    <p className="text-xs font-semibold text-red-500 mt-1">{errors.note}</p>
                                )}
                            </div>

                            {/* Submit button */}
                            <div className="flex gap-3 justify-end">
                                <Link href="/dashboard/ecommerce/stock-movements">
                                    <Button variant="outline" type="button">Cancel</Button>
                                </Link>
                                <Button type="submit" disabled={processing || !data.product_variant_id}>
                                    Save Movement
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* LIVE PREVIEW WIDGET */}
                    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-6 h-fit">
                        <h3 className="font-bold text-foreground flex items-center gap-1.5 border-b pb-3 border-border">
                            <Warehouse className="w-4 h-4 text-primary" />
                            Live Stock Estimator
                        </h3>

                        {selectedVariant ? (
                            <div className="space-y-5">
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</span>
                                    <p className="text-sm font-bold text-foreground truncate">{selectedVariant.name}</p>
                                    <p className="text-xs text-muted-foreground font-mono">SKU: {selectedVariant.sku}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-900/40 p-3 text-center border">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Current Stock</span>
                                        <p className="text-xl font-bold mt-1 text-foreground">{currentStock}</p>
                                    </div>

                                    <div className={`rounded-lg p-3 text-center border ${
                                        stockChange >= 0 
                                            ? 'bg-emerald-50/50 border-emerald-100' 
                                            : 'bg-rose-50/50 border-rose-100'
                                    }`}>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Stock Change</span>
                                        <p className={`text-xl font-extrabold mt-1 flex items-center justify-center gap-0.5 ${
                                            stockChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                        }`}>
                                            {stockChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                                            {stockChange >= 0 ? `+${stockChange}` : stockChange}
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
                                    <span className="text-xs font-bold text-primary uppercase">Estimated Stock After</span>
                                    <p className="text-3xl font-extrabold mt-1.5 text-primary">{projectedStock}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">This will update the variant's stock immediately.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                Select a product variant on the left to preview simulated stock updates in real-time.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
